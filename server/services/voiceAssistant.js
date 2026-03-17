const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

class VoiceAssistant {
  constructor() {
    this.ttsProvider = process.env.TTS_PROVIDER || 'coqui';
    this.coquiUrl = process.env.COQUI_URL || 'http://localhost:5002';
    this.elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.googleKey = process.env.GOOGLE_CLOUD_TTS_KEY;
    this.azureKey = process.env.AZURE_SPEECH_KEY;
    this.azureRegion = process.env.AZURE_SPEECH_REGION;
    
    // Cache for repeated phrases
    this.cache = new Map();
    
    // Voice mappings for personas
    this.personaVoices = {
      rahul: {
        provider: 'browser',
        voice: 'male_professional',
        pitch: 1.0,
        rate: 1.0
      },
      priya: {
        provider: 'browser',
        voice: 'female_friendly',
        pitch: 1.1,
        rate: 0.95
      },
      karan: {
        provider: 'browser',
        voice: 'male_energetic',
        pitch: 1.05,
        rate: 1.05
      },
      aditi: {
        provider: 'browser',
        voice: 'female_professional',
        pitch: 1.0,
        rate: 0.9
      }
    };
  }

  /**
   * Generate speech from text
   * @param {string} text - Text to convert to speech
   * @param {string} personaKey - Persona identifier for voice selection
   * @returns {Object} - Audio data and metadata
   */
  async speak(text, personaKey = 'rahul') {
    try {
      // Check cache first
      const cacheKey = `${personaKey}_${text}`;
      if (this.cache.has(cacheKey)) {
        console.log('Using cached audio for:', text.substring(0, 50));
        return this.cache.get(cacheKey);
      }

      const voiceConfig = this.personaVoices[personaKey] || this.personaVoices.rahul;
      
      let audioData;
      
      // Try providers in order of preference
      switch (this.ttsProvider) {
        case 'elevenlabs':
          audioData = await this.speakElevenLabs(text, voiceConfig);
          break;
        case 'openai':
          audioData = await this.speakOpenAI(text, voiceConfig);
          break;
        case 'google':
          audioData = await this.speakGoogle(text, voiceConfig);
          break;
        case 'azure':
          audioData = await this.speakAzure(text, voiceConfig);
          break;
        case 'coqui':
        default:
          // For Coqui or browser-based TTS, return metadata for client-side synthesis
          audioData = await this.getBrowserTTSConfig(text, voiceConfig);
          break;
      }

      // Cache the result
      if (this.cache.size > 100) {
        // Clear oldest entries if cache is too large
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, audioData);

      return audioData;
    } catch (error) {
      console.error('TTS error:', error.message);
      // Fallback to browser TTS config
      return this.getBrowserTTSConfig(text, this.personaVoices[personaKey]);
    }
  }

  /**
   * Browser-based TTS configuration (client-side synthesis)
   */
  async getBrowserTTSConfig(text, voiceConfig) {
    return {
      type: 'browser',
      text: text,
      config: {
        voice: voiceConfig.voice,
        pitch: voiceConfig.pitch,
        rate: voiceConfig.rate,
        volume: 1.0
      },
      duration: this.estimateDuration(text, voiceConfig.rate)
    };
  }

  /**
   * ElevenLabs TTS
   */
  async speakElevenLabs(text, voiceConfig) {
    if (!this.elevenLabsKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.getElevenLabsVoiceId(voiceConfig.voice);
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': this.elevenLabsKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    return {
      type: 'audio',
      format: 'mp3',
      data: audioBase64,
      duration: this.estimateDuration(text, voiceConfig.rate)
    };
  }

  /**
   * OpenAI TTS
   */
  async speakOpenAI(text, voiceConfig) {
    if (!this.openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const voice = this.getOpenAIVoice(voiceConfig.voice);
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: text,
        voice: voice,
        speed: voiceConfig.rate
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    return {
      type: 'audio',
      format: 'mp3',
      data: audioBase64,
      duration: this.estimateDuration(text, voiceConfig.rate)
    };
  }

  /**
   * Google Cloud TTS
   */
  async speakGoogle(text, voiceConfig) {
    if (!this.googleKey) {
      throw new Error('Google Cloud TTS key not configured');
    }

    const voice = this.getGoogleVoice(voiceConfig.voice);
    
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleKey}`,
      {
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: voice,
          ssmlGender: voiceConfig.voice.includes('male') && !voiceConfig.voice.includes('female') ? 'MALE' : 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: (voiceConfig.pitch - 1) * 20,
          speakingRate: voiceConfig.rate
        }
      }
    );

    return {
      type: 'audio',
      format: 'mp3',
      data: response.data.audioContent,
      duration: this.estimateDuration(text, voiceConfig.rate)
    };
  }

  /**
   * Azure Neural Voices
   */
  async speakAzure(text, voiceConfig) {
    if (!this.azureKey || !this.azureRegion) {
      throw new Error('Azure Speech credentials not configured');
    }

    const voice = this.getAzureVoice(voiceConfig.voice);
    const ssml = this.buildAzureSSML(text, voice, voiceConfig);
    
    const response = await axios.post(
      `https://${this.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      ssml,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    return {
      type: 'audio',
      format: 'mp3',
      data: audioBase64,
      duration: this.estimateDuration(text, voiceConfig.rate)
    };
  }

  /**
   * Helper: Build Azure SSML
   */
  buildAzureSSML(text, voice, config) {
    return `<speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' name='${voice}'>
        <prosody rate='${config.rate}' pitch='${(config.pitch - 1) * 50}%'>
          ${text}
        </prosody>
      </voice>
    </speak>`;
  }

  /**
   * Helper: Get ElevenLabs voice ID
   */
  getElevenLabsVoiceId(voiceName) {
    const voiceMap = {
      'male_professional': '21m00Tcm4TlvDq8ikWAM',
      'female_friendly': 'EXAVITQu4vr4xnSDxMaL',
      'male_energetic': 'pNInz6obpgDQGcFmaJgB',
      'female_professional': 'ThT5KcBeYPX3keUQqHPh'
    };
    return voiceMap[voiceName] || voiceMap['male_professional'];
  }

  /**
   * Helper: Get OpenAI voice
   */
  getOpenAIVoice(voiceName) {
    const voiceMap = {
      'male_professional': 'onyx',
      'female_friendly': 'nova',
      'male_energetic': 'echo',
      'female_professional': 'shimmer'
    };
    return voiceMap[voiceName] || 'onyx';
  }

  /**
   * Helper: Get Google voice
   */
  getGoogleVoice(voiceName) {
    const voiceMap = {
      'male_professional': 'en-US-Neural2-D',
      'female_friendly': 'en-US-Neural2-F',
      'male_energetic': 'en-US-Neural2-A',
      'female_professional': 'en-US-Neural2-C'
    };
    return voiceMap[voiceName] || 'en-US-Neural2-D';
  }

  /**
   * Helper: Get Azure voice
   */
  getAzureVoice(voiceName) {
    const voiceMap = {
      'male_professional': 'en-US-GuyNeural',
      'female_friendly': 'en-US-JennyNeural',
      'male_energetic': 'en-US-DavisNeural',
      'female_professional': 'en-US-AriaNeural'
    };
    return voiceMap[voiceName] || 'en-US-GuyNeural';
  }

  /**
   * Helper: Estimate audio duration
   */
  estimateDuration(text, rate = 1.0) {
    // Average speaking rate: ~150 words per minute at normal speed
    const words = text.split(/\s+/).length;
    const baseMinutes = words / 150;
    const seconds = (baseMinutes * 60) / rate;
    return Math.ceil(seconds);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Voice cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      provider: this.ttsProvider
    };
  }
}

module.exports = new VoiceAssistant();