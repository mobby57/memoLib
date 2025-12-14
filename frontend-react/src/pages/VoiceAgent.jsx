import { useState, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { voiceAPI } from '../services/api'
import toast from 'react-hot-toast'

const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      toast.success('Enregistrement démarré')
    } catch (error) {
      toast.error('Erreur d\'accès au microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      toast.success('Enregistrement arrêté')
    }
  }

  const processAudio = async (audioBlob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      
      const response = await voiceAPI.transcribe(formData)
      setTranscript(response.data.transcript)
      
      // Ici vous pourriez ajouter la logique pour traiter la transcription
      // et générer une réponse avec l'IA
      setResponse('Réponse générée par l\'IA basée sur votre demande vocale.')
      
    } catch (error) {
      toast.error('Erreur lors de la transcription')
    }
  }

  const playResponse = async () => {
    if (!response) return

    setIsPlaying(true)
    try {
      await voiceAPI.speak(response)
      toast.success('Lecture terminée')
    } catch (error) {
      toast.error('Erreur lors de la lecture')
    } finally {
      setIsPlaying(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agent Vocal IA</h1>
        <p className="text-gray-600">Interagissez avec l'IA par la voix</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Interface d'enregistrement */}
        <div className="card text-center mb-6">
          <div className="mb-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
          </div>
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isRecording ? 'Enregistrement en cours...' : 'Cliquez pour parler'}
          </p>
          <p className="text-sm text-gray-600">
            Appuyez sur le bouton et parlez clairement
          </p>
        </div>

        {/* Transcription */}
        {transcript && (
          <div className="card mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Votre demande :
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800">{transcript}</p>
            </div>
          </div>
        )}

        {/* Réponse */}
        {response && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Réponse de l'IA :
              </h3>
              <button
                onClick={playResponse}
                disabled={isPlaying}
                className="flex items-center text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {isPlaying ? (
                  <VolumeX className="h-5 w-5 mr-1" />
                ) : (
                  <Volume2 className="h-5 w-5 mr-1" />
                )}
                {isPlaying ? 'Lecture...' : 'Écouter'}
              </button>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-800">{response}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Exemples de commandes vocales :
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>"Compose un email de relance pour un client"</p>
            <p>"Génère une réponse professionnelle"</p>
            <p>"Crée un template d'email de remerciement"</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceAgent