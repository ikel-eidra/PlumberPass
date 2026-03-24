import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import UiIcon from "../components/UiIcon";
import type { SpeechRatePreset, VoiceOption } from "../hooks/useAudioReview";
import "../styles/settings-screen.css";

type SpeechRateOption = {
  id: SpeechRatePreset;
  label: string;
};

type SettingsScreenProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onBack: () => void;
  speechRateOptions: SpeechRateOption[];
  speechRatePreset: SpeechRatePreset;
  onSpeechRateChange: (preset: SpeechRatePreset) => void;
  availableVoices: VoiceOption[];
  selectedVoiceId: string;
  onSelectedVoiceChange: (voiceId: string) => void;
  isSpeechSupported: boolean;
  isRecognitionSupported: boolean;
  voiceStatus: string;
  transcript: string;
  onReadSample: () => void;
  onTestMicrophone: () => void;
  onStopAudio: () => void;
};

export default function SettingsScreen({
  theme,
  onThemeChange,
  onBack,
  speechRateOptions,
  speechRatePreset,
  onSpeechRateChange,
  availableVoices,
  selectedVoiceId,
  onSelectedVoiceChange,
  isSpeechSupported,
  isRecognitionSupported,
  voiceStatus,
  transcript,
  onReadSample,
  onTestMicrophone,
  onStopAudio,
}: SettingsScreenProps) {
  return (
    <div className="settings-screen">
      <header className="settings-screen__topbar">
        <button type="button" className="settings-screen__icon" onClick={onBack} aria-label="Back">
          <UiIcon name="arrowLeft" size={18} />
        </button>
        <div className="settings-screen__title">
          <p>Controls</p>
          <h1>Settings</h1>
        </div>
        <button type="button" className="settings-screen__icon" onClick={onStopAudio} aria-label="Stop audio">
          <UiIcon name="speaker" size={18} />
        </button>
      </header>

      <section className="settings-screen__panel">
        <div className="settings-screen__section-head">
          <div>
            <p>Theme</p>
            <h2>Visual mode</h2>
          </div>
        </div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <span className="settings-screen__helper">
          Night keeps the dashboard-style dark review shell. Paper uses a warm low-strain reading mode.
        </span>
      </section>

      <section className="settings-screen__panel">
        <div className="settings-screen__section-head">
          <div>
            <p>Narration</p>
            <h2>Voice speed</h2>
          </div>
          <span>{speechRateOptions.find((option) => option.id === speechRatePreset)?.label}</span>
        </div>
        <div className="settings-screen__speed-grid">
          {speechRateOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={speechRatePreset === option.id ? "is-active" : undefined}
              onClick={() => onSpeechRateChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-screen__panel">
        <div className="settings-screen__section-head">
          <div>
            <p>Narration</p>
            <h2>Voice selection</h2>
          </div>
          <span>{isSpeechSupported ? "Ready" : "Unavailable"}</span>
        </div>
        <label className="settings-screen__field">
          <span>Narrator voice</span>
          <select
            value={selectedVoiceId}
            onChange={(event) => onSelectedVoiceChange(event.target.value)}
            disabled={!isSpeechSupported || availableVoices.length <= 1}
          >
            {availableVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label}
              </option>
            ))}
          </select>
        </label>
        <div className="settings-screen__actions">
          <button type="button" onClick={onReadSample} disabled={!isSpeechSupported}>
            Read sample
          </button>
          <button type="button" className="ghost" onClick={onStopAudio}>
            Stop
          </button>
        </div>
      </section>

      <section className="settings-screen__panel">
        <div className="settings-screen__section-head">
          <div>
            <p>Voice input</p>
            <h2>Microphone and recognition</h2>
          </div>
          <span>{isRecognitionSupported ? "Enabled" : "Fallback only"}</span>
        </div>
        <div className="settings-screen__status-row">
          <span className={isSpeechSupported ? "is-ready" : "is-offline"}>
            TTS {isSpeechSupported ? "On" : "Off"}
          </span>
          <span className={isRecognitionSupported ? "is-ready" : "is-offline"}>
            Voice Answers {isRecognitionSupported ? "On" : "Off"}
          </span>
        </div>
        <div className="settings-screen__actions">
          <button type="button" onClick={onTestMicrophone} disabled={!isRecognitionSupported}>
            Test microphone
          </button>
          <button type="button" className="ghost" onClick={onStopAudio}>
            Stop listening
          </button>
        </div>
        <p className="settings-screen__status">{voiceStatus}</p>
        <p className="settings-screen__transcript">Transcript: {transcript || "Awaiting voice input."}</p>
      </section>
    </div>
  );
}
