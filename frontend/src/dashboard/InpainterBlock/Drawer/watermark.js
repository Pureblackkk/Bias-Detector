import {
    Stack,
    TextField,
    Slider,
    Checkbox,
    FormControlLabel,
    Box,
    Typography,
} from "@mui/material";
import { 
    useState,
    useRef,
    useEffect,
} from "react";

export const useWaterMark = () => {
    const watermarkCanvasRef = useRef(null);
    const [watermark, setWatermarkContent] = useState('watermark');
    const [size, setSize] = useState(50);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 120, y: 256 });
    const [showWaterMark, setShowWaterMark] = useState(false);

    // Draw watermark
    const drawWatermark = () => {
        const canvas = watermarkCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2) ";
        ctx.fillText(watermark, 0, 0);
        ctx.restore();
    };

    const exportImages = async () => {
        if (showWaterMark) {
            const watermarkImage = watermarkCanvasRef.current.toDataURL("image/png");
            return watermarkImage;
        } else {
            return undefined;
        }
    };

    const uiComponentRender = () => {
        return (
            <>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showWaterMark}
                            onChange={(e) => setShowWaterMark(e.target.checked)}
                        />
                    }
                    label="Generate watermark"
                />
                {
                    showWaterMark && <Stack direction='row' sx={{ alignItems: 'center' }} spacing={1}>
                        <TextField
                            label="Content"
                            value={watermark}
                            onChange={(e) => setWatermarkContent(e.target.value)}
                            size="small"
                            sx={{ mr: 2, width: 150}}
                        />
                        <Box sx={{ width: 100 }}>
                            <Typography id="input-slider-1" variant='caption' gutterBottom>
                                Size
                            </Typography>
                            <Slider
                                value={size}
                                onChange={(e, newValue) => setSize(newValue)}
                                min={10}
                                max={100}
                                valueLabelDisplay="auto"
                                sx={{ width: 100, mr: 2 }}
                            />
                        </Box>

                        <Box sx={{ width: 100 }}>
                            <Typography id="input-slider-2" variant='caption' gutterBottom>
                                Rotation
                            </Typography>
                            <Slider
                                value={rotation}
                                onChange={(e, newValue) => setRotation(newValue)}
                                min={-180}
                                max={180}
                                valueLabelDisplay="auto"
                                sx={{ width: 100, mr: 2 }}
                            />
                        </Box>

                        <TextField
                            label="X"
                            type="number"
                            value={position.x}
                            onChange={(e) =>
                                setPosition({ ...position, x: parseInt(e.target.value, 10) || 0 })
                            }
                            size="small"
                            sx={{ width: 80, mr: 2 }}
                        />
                        <TextField
                            label="Y"
                            type="number"
                            value={position.y}
                            onChange={(e) =>
                                setPosition({ ...position, y: parseInt(e.target.value, 10) || 0 })
                            }
                            size="small"
                            sx={{ width: 80, mr: 2 }}
                        />
                    </Stack>
                }
            </>
        );
    };
    

    useEffect(() => {
        drawWatermark();
    }, [showWaterMark, watermark, size, rotation, position, watermarkCanvasRef.current]);

    const waterMarkReset = () => {
        setWatermarkContent('watermark');
        setSize(50);
        setRotation(0);
        setPosition({x: 100, y: 100});
        setShowWaterMark(false);
    };
    
    return {
        waterMarkReset,
        waterMarkExportImages: exportImages,
        waterMarkUIComponentRender: uiComponentRender,
        showWaterMark,
        watermarkCanvasRef,
    };
}