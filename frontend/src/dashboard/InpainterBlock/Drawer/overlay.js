import {
    Stack,
    TextField,
    Slider,
    Button,
    Box,
    Typography,
} from "@mui/material";
import { 
    useState,
    useRef,
    useEffect,
} from "react";

export const useOverLay = () => {
    const overlayCanvasRef = useRef(null);
    const [overlayImage, setOverlayImage] = useState(null);
    const [overlaySize, setOverlaySize] = useState(1);
    const [overlayPosition, setOverlayPosition] = useState({ x: 100, y: 100 });
    const [showOverlay, setShowOverlay] = useState(false);

    const fileInputRef = useRef(null);

    // handle upload file
    const handleFileUpload = (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = () => setOverlayImage(reader.result);
            reader.readAsDataURL(file);

            event.target.value = "";
        }
    };

    useEffect(() => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return;

        if(overlayImage === null) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = overlayImage;

        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
                img,
                overlayPosition.x,
                overlayPosition.y,
                img.width * overlaySize,
                img.height * overlaySize
            );
            ctx.globalAlpha = 1;
        };
    }, [showOverlay, overlayImage, overlaySize, overlayPosition, overlayCanvasRef.current]);

    const exportImages = async () => {
        if (showOverlay) {
            const overlayImage = overlayCanvasRef.current.toDataURL("image/png");
            return overlayImage;
        } else {
            return undefined;
        }
    };

    const handleDeleteImage = () => {
        setOverlayImage(null);
    };

    const uiComponentRender = () => {
        return (
            <>
                   <Box sx={{ mt: 2 }}>
                        <input ref={fileInputRef} style={{display: 'none'}} type="file" accept="image/*" onChange={(e) => {
                            setShowOverlay(true);
                            handleFileUpload(e);
                        }}/>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => fileInputRef.current.click()}
                        >
                            Uplood Image
                        </Button>

                        {overlayImage && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleDeleteImage}
                            sx={{ ml: 2 }}
                        >
                            Delete Image
                        </Button>
                    )}
                    </Box>
                {
                    showOverlay && <Stack direction='row' sx={{ alignItems: 'center' }} spacing={1}>
                        <Box sx={{ width: 100 }}>
                            <Typography id="input-slider-1" variant='caption' gutterBottom>
                                Size
                            </Typography>
                            <Slider
                                value={overlaySize}
                                onChange={(e, newValue) => setOverlaySize(newValue)}
                                min={0}
                                step={0.1}
                                max={2}
                                valueLabelDisplay="auto"
                                sx={{ width: 100, mr: 2 }}
                            />
                        </Box>

                        <TextField
                            label="X"
                            type="number"
                            value={overlayPosition.x}
                            onChange={(e) =>
                                setOverlayPosition({ ...overlayPosition, x: parseInt(e.target.value, 10) || 0 })
                            }
                            size="small"
                            sx={{ width: 80, mr: 2 }}
                        />

                        <TextField
                            label="Y"
                            type="number"
                            value={overlayPosition.y}
                            onChange={(e) =>
                                setOverlayPosition({ ...overlayPosition, y: parseInt(e.target.value, 10) || 0 })
                            }
                            size="small"
                            sx={{ width: 80, mr: 2 }}
                        />
                    </Stack>
                }
            </>
        );
    };

    const overlayReset = () => {
        setOverlayImage(null);
        setOverlaySize(1);
        setOverlayPosition({x: 100, y: 100});
        setShowOverlay(false);
    };
    
    return {
        overlayReset,
        overlayExportImages: exportImages,
        overlayImageUIComponentRender: uiComponentRender,
        showOverlay,
        overlayCanvasRef,
    };
}