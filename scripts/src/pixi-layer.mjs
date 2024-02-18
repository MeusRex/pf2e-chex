import * as PIXI from "pixi.js";
//@ts-ignore
export default class ChexDrawingLayer extends PIXI.Container {
    constructor() {
        super();
        this.zIndex = 0;
        this.visible = false;
    }
    draw() {
        this.removeChildren().forEach(c => c.destroy());
        this.mask = canvas.primary.mask;
        const g = this.addChild(new PIXI.Graphics());
    }
    antialiasing = `
        precision mediump float;
        uniform sampler2D uSampler;
        uniform vec2 uResolution;

        void main() {
            vec2 pixelSize = vec2(1.0, 1.0) / uResolution;
            vec4 centerColor = texture2D(uSampler, gl_FragCoord.xy / uResolution);

            // Sample surrounding pixels for antialiasing
            vec4 leftColor = texture2D(uSampler, gl_FragCoord.xy / uResolution - vec2(pixelSize.x, 0.0));
            vec4 rightColor = texture2D(uSampler, gl_FragCoord.xy / uResolution + vec2(pixelSize.x, 0.0));
            vec4 topColor = texture2D(uSampler, gl_FragCoord.xy / uResolution + vec2(0.0, pixelSize.y));
            vec4 bottomColor = texture2D(uSampler, gl_FragCoord.xy / uResolution - vec2(0.0, pixelSize.y));

            // Calculate the average color of surrounding pixels
            vec4 avgColor = (centerColor + leftColor + rightColor + topColor + bottomColor) / 5.0;

            // Output the averaged color
            gl_FragColor = avgColor;
        }
    `;
    coreShader = `
        precision mediump float;

        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float uOutlineWidth;
        uniform float uAlpha;

        void main(void) {
            vec4 textureColor = texture2D(uSampler, vTextureCoord);

            // Sample neighboring pixels
            vec4 leftTopColor = texture2D(uSampler, vTextureCoord + vec2(-uOutlineWidth, -uOutlineWidth));
            vec4 leftBottomColor = texture2D(uSampler, vTextureCoord + vec2(-uOutlineWidth, uOutlineWidth));
            vec4 leftColor = texture2D(uSampler, vTextureCoord + vec2(-uOutlineWidth, 0.0));
            vec4 rightColor = texture2D(uSampler, vTextureCoord + vec2(uOutlineWidth, 0.0));
            vec4 rightTopColor = texture2D(uSampler, vTextureCoord + vec2(uOutlineWidth, -uOutlineWidth));
            vec4 rightBottomColor = texture2D(uSampler, vTextureCoord + vec2(uOutlineWidth, uOutlineWidth));
            vec4 topColor = texture2D(uSampler, vTextureCoord + vec2(0.0, -uOutlineWidth));
            vec4 bottomColor = texture2D(uSampler, vTextureCoord + vec2(0.0, uOutlineWidth));

            // Check for color change (red to blue)
            bool isColorChange = any(notEqual(textureColor.rgb, leftColor.rgb)) ||
                                any(notEqual(textureColor.rgb, leftTopColor.rgb)) ||
                                any(notEqual(textureColor.rgb, leftBottomColor.rgb)) ||
                                any(notEqual(textureColor.rgb, rightTopColor.rgb)) ||
                                any(notEqual(textureColor.rgb, rightBottomColor.rgb)) ||
                                any(notEqual(textureColor.rgb, rightColor.rgb)) ||
                                any(notEqual(textureColor.rgb, topColor.rgb)) ||
                                any(notEqual(textureColor.rgb, bottomColor.rgb));

            if (textureColor[3] == 0.0) {
                // ignore stuff with we can't see
                gl_FragColor = textureColor;
            }
            else {
                gl_FragColor = isColorChange ? textureColor : vec4(textureColor.rgb, uAlpha);
            }
        }`;
}
