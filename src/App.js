import MicRecorder from "mic-recorder-to-mp3"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import "./App.css"

// Set AssemblyAI Axios Header
const assembly = axios.create({
  baseURL: "https://api.assemblyai.com/v2",
  headers: {
    authorization: "20cbf5e35d6444f5a1867bb52b83957e",
    "content-type": "application/json",
    "transfer-encoding": "chunked",
  },
})

const App = () => {
  // Mic-Recorder-To-MP3
  const recorder = useRef(null) //Recorder
  const audioPlayer = useRef(null) //Ref for the HTML Audio Tag
  const [blobURL, setBlobUrl] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [isRecording, setIsRecording] = useState(null)
  const currentURL = window.location.href;
  const actionsObject = [
    { id: 1, page: 'RC', action: 'goto' }
  ]
  const rcURL = 'http://localhost:5000/#/workbench/revenuecontracts/viewrevenuecontracts/11596/1';
  const rcTemplateDelURL = 'http://localhost:5000/#/policies/rcgroupingtemplate';
  const forecastEditURL = 'http://localhost:5000/#/policies/forecast';
  const sspKnowledgeURL = 'https://knowledgecenter.zuora.com/Zuora_Revenue/W_Advanced_functionalities/SSP_setup/Calculate_SSP_with_Analyzer';

  useEffect(() => {
    //Declares the recorder object and stores it inside of ref
    recorder.current = new MicRecorder({ bitRate: 128 })
  }, [])

  const startRecording = () => {
    // Check if recording isn't blocked by browser
    recorder.current.start().then(() => {
      setIsRecording(true)
    })
  }

  const stopRecording = () => {
    recorder.current
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const file = new File(buffer, "audio.mp3", {
          type: blob.type,
          lastModified: Date.now(),
        })
        const newBlobUrl = URL.createObjectURL(blob)
        setBlobUrl(newBlobUrl)
        setIsRecording(false)
        setAudioFile(file)
      })
      .catch((e) => console.log(e))
  }

  // AssemblyAI API

  // State variables
  const [uploadURL, setUploadURL] = useState("")
  const [transcriptID, setTranscriptID] = useState("")
  const [transcriptData, setTranscriptData] = useState("")
  const [transcript, setTranscript] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Upload the Audio File and retrieve the Upload URL
  useEffect(() => {
    if (audioFile) {
      assembly
        .post("/upload", audioFile)
        .then((res) => setUploadURL(res.data.upload_url))
        .catch((err) => console.error(err))
    }
  }, [audioFile])

  // Submit the Upload URL to AssemblyAI and retrieve the Transcript ID
  const submitTranscriptionHandler = () => {
    assembly
      .post("/transcript", {
        audio_url: uploadURL,
      })
      .then((res) => {
        setTranscriptID(res.data.id)

        checkStatusHandler()
      })
      .catch((err) => console.error(err))
  }

  // Check the status of the Transcript
  const checkStatusHandler = async () => {
    setIsLoading(true)
    try {
      await assembly.get(`/transcript/${transcriptID}`).then((res) => {
        setTranscriptData(res.data)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const performTask = (command) => {
    console.log(command);
    if (command.includes('take')) {
      setTimeout(() => {
        window.open(rcURL, '_blank');
      }, 1000);
    } else if (command.includes('delete')) {
      setTimeout(() => {
        window.open(rcTemplateDelURL,'_blank');
      }, 2000);
    } else if (command.includes('disable')) {
      setTimeout(() => {
        window.open(forecastEditURL,'_blank');
      }, 2000);
    } else if (command.includes('calculate')) {
      setTimeout(() => {
        window.open(sspKnowledgeURL,'_blank');
      }, 2000);
    }
  }

  // Periodically check the status of the Transcript
  useEffect(() => {
    const interval = setInterval(() => {
      if (transcriptData.status !== "completed" && isLoading) {
        checkStatusHandler()
      } else {
        setIsLoading(false)
        setTranscript(transcriptData.text)
        clearInterval(interval)
        if (transcriptData.text) {
        performTask(transcriptData.text)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [transcriptData])

  return (
    <div className="app-container">
      <h1 className="header-name">Z-iri</h1>
      <audio className="audio-control" ref={audioPlayer} src={blobURL} controls='controls' />
      <div>
        <button disabled={isRecording} onClick={startRecording}>
          START
        </button>
        <button disabled={!isRecording} onClick={stopRecording}>
          STOP
        </button>
        <button onClick={submitTranscriptionHandler}>SUBMIT</button>
      </div>
      {transcriptData.status === "completed" ? (
        <p>{transcript}</p>
      ) : (
        <p>{transcriptData.status}</p>
      )}
    </div>
  )
}

export default App
