import * as PIXI from "pixi.js"
//@ts-ignore
export default class PixiLayer {
    constructor() {
    }

    container: PIXI.Container = new PIXI.Container();

    hexSize = 0;

    createHexagonTexture(size: number, color: string) {
        const graphics = new PIXI.Graphics();
        size++;
        //graphics.lineStyle(2, color, 0.5);
        graphics.beginFill(color, 1);
        graphics.moveTo(size * Math.cos(0), size * Math.sin(0));
    
        for (let i = 1; i <= 6; i++) {
            graphics.lineTo(
                size * Math.cos(i * 2 * Math.PI / 6),
                size * Math.sin(i * 2 * Math.PI / 6)
            );
        }
    
        graphics.endFill();
        
        // Convert graphics to texture and cache it
        const texture = app.renderer.generateTexture(graphics);
        return texture;
    }

    public setup(xHexes: number, yHexes: number, hexSize: number) {
        this.hexSize = hexSize;
        let size = hexSize + 1;

        const graphics = new PIXI.Graphics();
        //graphics.lineStyle(2, color, 0.5);
        graphics.beginFill(color, 1);
        graphics.moveTo(size * Math.cos(0), size * Math.sin(0));

        for (let i = 1; i <= 6; i++) {
            graphics.lineTo(
                size * Math.cos(i * 2 * Math.PI / 6),
                size * Math.sin(i * 2 * Math.PI / 6)
            );
        }

        graphics.endFill();
        
        // Convert graphics to texture and cache it
        const texture = app.renderer.generateTexture(graphics);
        return texture;
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
