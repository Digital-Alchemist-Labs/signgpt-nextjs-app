export interface SignHoverData {
  text: string;
  signVideoUrl?: string;
  signImageUrl?: string;
  description?: string;
  category?:
    | "button"
    | "text"
    | "dropdown"
    | "input"
    | "navigation"
    | "general";
}

export interface SignHoverPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignHoverConfig {
  enabled: boolean;
  showDelay: number;
  hideDelay: number;
  preferredFormat: "video" | "image";
  position: "auto" | "top" | "bottom" | "left" | "right";
}

declare global {
  interface HTMLElement {
    "data-sign-text"?: string;
    "data-sign-video"?: string;
    "data-sign-image"?: string;
    "data-sign-description"?: string;
    "data-sign-category"?: string;
  }
}
