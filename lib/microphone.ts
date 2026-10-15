export class MicrophoneController {

    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;

    // 👉 força o tipo correto aqui
    private dataArray: Uint8Array<ArrayBuffer> | null = null;
    private animationFrame: number | null = null;

    private recorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];

    private listening = false;
    private recording = false;
    private processing = false;
    private voiceDetected = false;

    private smoothedLevel = 0;
    private silenceStartTime = 0;

    private readonly voiceThreshold = 0.035;
    private readonly silenceDuration = 800;

    private onVoiceDetected: (() => void) | null = null;
    private onAudioCaptured: ((audio: Blob) => void) | null = null;

    public setProcessing(value: boolean): void {
        this.processing = value;
        console.log(`[MIC] Processing: ${value}`);
    }

    public setCallbacks(
        onVoiceDetected: () => void,
        onAudioCaptured: (audio: Blob) => void
    ): void {
        this.onVoiceDetected = onVoiceDetected;
        this.onAudioCaptured = onAudioCaptured;
    }

    public resetVoiceDetection(): void {
        this.voiceDetected = false;
        this.silenceStartTime = 0;
        this.smoothedLevel = 0;
        console.log("[MIC] 🔄 Detector de voz resetado.");
    }

    public async start(): Promise<void> {

        if (this.listening) return;

        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("API de microfone não disponível. Use localhost ou HTTPS.");
        }

        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permissionStream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === "audioinput");

        console.log("[MIC] Microfones disponíveis:");
        audioInputs.forEach((d, i) => console.log(`[MIC] ${i}:`, d.label, d.deviceId));

        const headset = audioInputs.find(d =>
            d.label.toLowerCase().includes("soundcore") &&
            d.label.toLowerCase().includes("q35")
        );

        if (headset) {
            console.log("[MIC] 🎧 Soundcore Life Q35 encontrado.");
            console.log("[MIC] Device ID:", headset.deviceId);
        } else {
            console.warn("[MIC] ⚠️ Soundcore Life Q35 não encontrado. Usando microfone padrão.");
        }

        const audioConstraints = headset
            ? { deviceId: { exact: headset.deviceId } }
            : true;

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

        const track = this.stream.getAudioTracks()[0];
        console.log("[MIC] 🎤 Microfone selecionado:", track.label);
        console.log("[MIC] Configurações:", track.getSettings());

        this.audioContext = new AudioContext();
        await this.audioContext.resume();

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        // 👉 cria uma vez, com tipo certo
        this.dataArray = new Uint8Array(this.analyser.fftSize) as Uint8Array<ArrayBuffer>;

        this.microphone = this.audioContext.createMediaStreamSource(this.stream);
        this.microphone.connect(this.analyser);

        this.setupRecorder();

        this.listening = true;
        this.voiceDetected = false;
        this.recording = false;
        this.silenceStartTime = 0;
        this.smoothedLevel = 0;

        console.log("[MIC] ✅ Microfone ativado.");

        this.analyse();
    }

    private setupRecorder(): void {
        if (!this.stream) throw new Error("Stream do microfone não disponível.");

        let mimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            throw new Error("Navegador não suporta gravação.");
        }

        this.recorder = new MediaRecorder(this.stream, { mimeType });

        this.recorder.addEventListener("dataavailable", (event: BlobEvent) => {
            if (event.data.size > 0) this.audioChunks.push(event.data);
        });

        this.recorder.addEventListener("stop", () => {
            const audioBlob = new Blob(this.audioChunks, {
                type: this.recorder?.mimeType || "audio/webm"
            });

            console.log("[MIC] Áudio capturado:", audioBlob.size, "bytes");
            console.log("[MIC] Tipo:", audioBlob.type);

            this.audioChunks = [];

            this.onAudioCaptured?.(audioBlob);
        });
    }

    private startRecording(): void {
        if (!this.recorder || this.recording) return;

        this.audioChunks = [];
        this.recorder.start();
        this.recording = true;

        console.log("[MIC] 🔴 Gravação iniciada.");
    }

    private stopRecording(): void {
        if (!this.recorder || !this.recording) return;

        this.recorder.stop();
        this.recording = false;

        console.log("[MIC] ⏹ Gravação finalizada.");
    }

    private analyse(): void {
        if (!this.listening || !this.analyser || !this.dataArray) return;

        if (this.processing) {
            this.animationFrame = requestAnimationFrame(() => this.analyse());
            return;
        }

        // 👉 aqui a gente força o tipo certo na chamada
        this.analyser.getByteTimeDomainData(this.dataArray as Uint8Array<ArrayBuffer>);

        let sumSquares = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const normalized = (this.dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
        }

        const rms = Math.sqrt(sumSquares / this.dataArray.length);
        this.smoothedLevel += (rms - this.smoothedLevel) * 0.2;

        const now = performance.now();

        if (this.smoothedLevel > this.voiceThreshold) {
            this.silenceStartTime = 0;

            if (!this.voiceDetected) {
                this.voiceDetected = true;
                console.log("[MIC] 🎤 Voz detectada.");
                this.onVoiceDetected?.();
                this.startRecording();
            }

        } else {
            if (this.voiceDetected && this.silenceStartTime === 0) {
                this.silenceStartTime = now;
                console.log("[MIC] Silêncio iniciado...");
            }

            if (
                this.voiceDetected &&
                this.silenceStartTime > 0 &&
                now - this.silenceStartTime >= this.silenceDuration
            ) {
                this.voiceDetected = false;
                this.silenceStartTime = 0;

                console.log("[MIC] 🤫 Fim da fala.");
                this.stopRecording();
            }
        }

        if (this.listening) {
            this.animationFrame = requestAnimationFrame(() => this.analyse());
        }
    }

    public stop(): void {
        this.listening = false;

        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.recording) this.stopRecording();

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        this.stream = null;
        this.recording = false;
        this.voiceDetected = false;

        console.log("[MIC] Microfone desligado.");
    }
}
