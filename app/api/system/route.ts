import os from "os";
import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  let gpuInfo = "N/A";
  try {
    const output = execSync("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader", { encoding: "utf-8" });
    gpuInfo = output.trim();
  } catch (e) {
    gpuInfo = "Nenhuma GPU NVIDIA detectada";
  }  
  const info = {
    os: `${os.type()} ${os.release()}`,
    cpu: os.cpus()[0].model,
    cores: os.cpus().length,
    memory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,   
    gpu: gpuInfo, // opcional
  };
  
  
  
  
  return NextResponse.json(info);
}
