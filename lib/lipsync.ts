export class LipSyncController {

    private audio: HTMLAudioElement;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private source: MediaElementAudioSourceNode;

    private dataArray: Uint8Array;
    private animationFrame: number | null = null;

    private smoothedLevel = 0;

    private mouthLine: SVGPathElement;
    private leftEye: SVGGElement;
    private rightEye: SVGGElement;

    constructor(
        mouthLine: SVGPathElement,
        leftEye: SVGGElement,
        rightEye: SVGGElement
    ) {
        this.mouthLine = mouthLine;
        this.leftEye = leftEye;
        this.rightEye = rightEye;

        this.audio = new Audio();
        this.audio.preload = "auto";

        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.dataArray = new Uint8Array(this.analyser.fftSize);

        this.audio.addEventListener("ended", () => {
            this.stopAnalysis();
            this.closeMouth();
        });
    }

    public async speakText(text: string): Promise<void> {
  const ttsRes = await fetch("https://192.168.2.11:8001/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const arrayBuffer = await ttsRes.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "audio/wav" });

  await this.playBlob(blob);
}


    public async playBlob(blob: Blob): Promise<void> {
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        const url = URL.createObjectURL(blob);

        this.audio.src = url;
        this.audio.currentTime = 0;

        try {
            await this.audio.play();
            this.startAnalysis();
        } finally {
            this.audio.addEventListener(
                "ended",
                () => URL.revokeObjectURL(url),
                { once: true }
            );
        }
    }

    private startAnalysis(): void {
        this.stopAnalysis();

        const analyse = () => {
            //this.analyser.getByteTimeDomainData(this.dataArray);
            this.dataArray = new Uint8Array(this.analyser.fftSize);
            let sumSquares = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                const normalized = (this.dataArray[i] - 128) / 128;
                sumSquares += normalized * normalized;
            }

            const rms = Math.sqrt(sumSquares / this.dataArray.length);
            const level = Math.min(rms * 3.5, 1);

            this.smoothedLevel += (level - this.smoothedLevel) * 0.35;

            this.updateMouth(this.smoothedLevel);
            this.updateEyes(this.smoothedLevel);

            if (!this.audio.paused) {
                this.animationFrame = requestAnimationFrame(analyse);
            }
        };

        analyse();
    }

    private updateMouth(level: number): void {
        const minimum = 2;
        const maximum = 38;

        const opening = minimum + level * maximum;
        const width = 65 + level * 12;

        const left = 250 - width;
        const right = 250 + width;

        const centerY = 348;
        const curveY = centerY + opening;

        this.mouthLine.setAttribute(
            "d",
            `M${left} ${centerY} Q250 ${curveY} ${right} ${centerY}`
        );
    }

    private updateEyes(level: number): void {
        const scale = 1 + level * 0.12;

        this.leftEye.style.transform = `scale(${scale})`;
        this.rightEye.style.transform = `scale(${scale})`;
    }

    private closeMouth(): void {
        this.mouthLine.setAttribute("d", "M185 348 Q250 348 315 348");

        this.leftEye.style.transform = "scale(1)";
        this.rightEye.style.transform = "scale(1)";
    }

    private stopAnalysis(): void {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}
