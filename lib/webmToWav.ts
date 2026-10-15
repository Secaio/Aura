declare const window: any;

// Garante que FFmpeg está carregado antes de usar
async function waitForFFmpeg(): Promise<any> {
    return new Promise((resolve, reject) => {
        const check = () => {
            if (window.FFmpeg) {
                resolve(window.FFmpeg);
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

/**
 * Converte Blob WebM → WAV PCM 16-bit usando ffmpeg.wasm via CDN
 */
export async function webmToWav(webmBlob: Blob): Promise<Blob> {
    // Aguarda FFmpeg estar disponível
    const FFmpeg = await waitForFFmpeg();

    const { createFFmpeg, fetchFile } = FFmpeg;

    const ffmpeg = createFFmpeg({
        log: false
    });

    await ffmpeg.load();

    const data = await fetchFile(webmBlob);

    ffmpeg.FS("writeFile", "input.webm", data);

    await ffmpeg.run(
        "-i", "input.webm",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "output.wav"
    );

    const wavData = ffmpeg.FS("readFile", "output.wav");

    const safeBuffer = new ArrayBuffer(wavData.length);
    new Uint8Array(safeBuffer).set(wavData);

    return new Blob([safeBuffer], { type: "audio/wav" });
}
