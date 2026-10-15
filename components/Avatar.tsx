"use client";

import { useEffect, useRef } from "react";
import { AvatarController } from "@/lib/avatarController";
import { LipSyncController } from "@/lib/lipsync";
import "@/app/styles/avatar.css";

export function Avatar(props: {
    onReady?: (controller: AvatarController) => void;
    onLipSyncReady?: (controller: LipSyncController) => void;
}) {

    const avatarRef = useRef<HTMLDivElement>(null);
    const stateTextRef = useRef<HTMLSpanElement>(null);

    const mouthRef = useRef<SVGPathElement>(null);
    const leftEyeRef = useRef<SVGGElement>(null);
    const rightEyeRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!avatarRef.current || !stateTextRef.current) return;

        const controller = new AvatarController(
            avatarRef.current,
            stateTextRef.current
        );

        props.onReady?.(controller);

        if (mouthRef.current && leftEyeRef.current && rightEyeRef.current) {
            const lipsync = new LipSyncController(
                mouthRef.current,
                leftEyeRef.current,
                rightEyeRef.current
            );

            props.onLipSyncReady?.(lipsync);
        }
    }, []); 


    return (
        <section className="avatar-container">

            <div ref={avatarRef} id="avatar" className="avatar idle">

                <svg
                    className="robot-face"
                    viewBox="0 0 500 500"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Avatar robótico"
                >

                    {/* Glow externo */}
                    <circle className="avatar-glow" cx="250" cy="250" r="210" />

                    {/* Cabeça */}
                    <rect className="head" x="75" y="80" width="350" height="340" rx="100" />

                    {/* Orelhas */}
                    <rect className="ear left-ear" x="45" y="205" width="35" height="90" rx="15" />
                    <rect className="ear right-ear" x="420" y="205" width="35" height="90" rx="15" />

                    {/* Olho esquerdo */}
                    <g ref={leftEyeRef} className="eye left-eye">
                        <ellipse className="eye-outer" cx="170" cy="220" rx="48" ry="58" />
                        <circle className="eye-core" cx="170" cy="220" r="18" />
                        <circle className="eye-highlight" cx="163" cy="212" r="6" />
                    </g>

                    {/* Olho direito */}
                    <g ref={rightEyeRef} className="eye right-eye">
                        <ellipse className="eye-outer" cx="330" cy="220" rx="48" ry="58" />
                        <circle className="eye-core" cx="330" cy="220" r="18" />
                        <circle className="eye-highlight" cx="323" cy="212" r="6" />
                    </g>

                    {/* Nariz/sensor */}
                    <circle className="sensor" cx="250" cy="285" r="10" />

                    {/* Boca */}
                    <g className="mouth">
                        <rect className="mouth-frame" x="155" y="320" width="190" height="55" rx="27" />
                        <path
                            ref={mouthRef}
                            className="mouth-line"
                            d="M185 348 Q250 365 315 348"
                        />
                    </g>

                    {/* Luzes inferiores */}
                    <circle className="status-light light-1" cx="205" cy="395" r="5" />
                    <circle className="status-light light-2" cx="250" cy="395" r="5" />
                    <circle className="status-light light-3" cx="295" cy="395" r="5" />

                </svg>

            </div>

            <div className="state-display">
                <span>STATUS</span>
                <strong ref={stateTextRef} id="stateText">IDLE</strong>
            </div>

        </section>
    );
}

export default Avatar;
