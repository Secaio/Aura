export type AvatarState =
    | "idle"
    | "listening"
    | "thinking"
    | "speaking";

export class AvatarController {

    private avatar: HTMLElement;
    private stateText: HTMLElement;
    private currentState: AvatarState = "idle";

    constructor(avatar: HTMLElement, stateText: HTMLElement) {
        this.avatar = avatar;
        this.stateText = stateText;
        this.setState("idle");
    }

    public setState(state: AvatarState): void {
        this.currentState = state;

        this.avatar.classList.remove(
            "idle",
            "listening",
            "thinking",
            "speaking"
        );

        this.avatar.classList.add(state);

        this.stateText.textContent = state.toUpperCase();

        console.log(`[AVATAR] Estado: ${state}`);
    }

    public getState(): AvatarState {
        return this.currentState;
    }
}
