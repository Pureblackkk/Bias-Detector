import { Box, Stack, Button } from '@mui/material';
import API_URL from '../../../common/api';
import { useEffect, useRef } from 'react';
import { forEach } from 'lodash';

const getMaskPathFromKeywords = (
    selectedKeywords,
    keywordsPathPair,
) => {
    if (selectedKeywords.size === 0) return {};

    const maskPaths = [];
    const upLoadImagePaths = [];
    const waterMarkPaths = [];

    Array.from(selectedKeywords).forEach((keyword) => {
        if(keyword in keywordsPathPair) {
            const path = keywordsPathPair[keyword];

            if (typeof path === "object") {
                const {
                    mask_path,
                    upload_path,
                    watermark_path,
                } = path;

                !!mask_path && maskPaths.push(mask_path);
                !!upload_path && upLoadImagePaths.push(upload_path);
                !!watermark_path && waterMarkPaths.push(watermark_path);
            } else {
                maskPaths.push(path);
            }
        }
    });

    const pathList = [...maskPaths, ...upLoadImagePaths, ...waterMarkPaths];
    const isMaskList = pathList.map((_, index) => index < maskPaths.length ? 1 : 0);

    return {
        pathList,
        isMaskList,
    };
};

const ImageMask = ({
    solIndex,
    selectedImgURL,
    selectedKeywords,
    panoptic,
    reloadImageBatch,
    invert,
}) => {
    const imageRefCanvasRefPair = useRef({});

    const invertImages = (key) => {
        const currentPairObject = imageRefCanvasRefPair.current;
        if (!currentPairObject) return;

        const { img, canvas } = currentPairObject[key];

        const ctx = canvas.getContext("2d", {willReadFrequently: true});

        if (!img.complete) {
            console.log('Not compelete');
            return;
        }

        canvas.width = 150;
        canvas.height = 150;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, 150, 150);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let fixedColor = undefined;

        // Set the fixed the fixed color
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a !== 0) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                fixedColor = [r, g, b];
                break;
            }
        }

        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];

            if (a === 0) {
                data[i] = fixedColor[0];
                data[i + 1] = fixedColor[1];
                data[i + 2] = fixedColor[2];
                data[i + 3] = 255;
            } else {
                data[i + 3] = 0;
            }
        }

        // Update
        ctx.putImageData(imageData, 0, 0);
    };

    return (
        <Box>
            <Box sx={{marginTop: '20px'}}>
                <Button
                    variant="contained"
                    disableElevation
                    onClick={reloadImageBatch}
                >
                    Change a batch
                </Button>
            </Box>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: '16px', mt: 2, p: 1 }}>
                {
                    selectedImgURL 
                    && selectedImgURL.length > 0
                    && selectedImgURL.map((imgURL, imageIndex) => {
                        // Get corresponding mask path
                        const { pathList, isMaskList } = getMaskPathFromKeywords(
                            selectedKeywords,
                            panoptic[imgURL]
                        );

                        return (
                            <Stack
                                direction="column"
                                spacing={1}>
                                <Box
                                    key={`Image${solIndex}-${imageIndex}`}
                                    sx={{ position: 'relative', width: '150px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <img
                                        src={`${API_URL}/api/static/` + imgURL}
                                        style={{ width: '150px', maxHeight: '150px', marginBottom: '8px' }} // Adjust marginBottom as needed
                                        alt={`Image ${solIndex}-${imageIndex}`}
                                    />
                                    <Box>
                                        {pathList?.map((mask, idx) => (
                                            <>
                                                <Box
                                                    key={`Panoptic${solIndex}-${imageIndex}-${idx}`}
                                                    component="img"
                                                    src={`${API_URL}/api/` + mask} // Adjust the path to your colored mask
                                                    crossOrigin="anonymous"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '150px',
                                                        height: '150px',
                                                        opacity: isMaskList[idx] ? 0.6 : 1,
                                                        visibility: (invert && isMaskList[idx]) ? 'hidden' : 'visible'
                                                    }}
                                                    alt={`Mask Overlay ${idx}`}
                                                    ref={(refNode) => {
                                                        const refPair = {
                                                            'img': refNode
                                                        };
                                                        imageRefCanvasRefPair.current[`${imageIndex}-Panoptic${mask}`] = refPair;
                                                    }}
                                                    onLoad={() => {invertImages(`${imageIndex}-Panoptic${mask}`)}}
                                                />
                                                <canvas
                                                    ref={(refNode) => {
                                                        imageRefCanvasRefPair.current[`${imageIndex}-Panoptic${mask}`]['canvas'] = refNode;
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '150px',
                                                        height: '150px',
                                                        opacity: isMaskList[idx] ? 0.6 : 1,
                                                        visibility: (invert && isMaskList[idx]) ? 'visible' : 'hidden',
                                                    }}
                                                />
                                            </>
                                        ))}
                                    </Box>
                                </Box>
                                <Box key={`Mask${solIndex}-${imageIndex}`} sx={{ position: 'relative', width: '150px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '150px', maxHeight: '150px', marginBottom: '8px', border: "black 1px" }} />
                                    <Box sx={{ border: pathList?.length > 0 ? 'solid black 1px' : '', width: '150px', height: '150px',  position: 'absolute', top: 0, left: 0, }}>
                                        {pathList?.map((mask, idx) => (
                                            <>
                                                <Box
                                                    key={`Inpainted${solIndex}-${imageIndex}-${idx}`}
                                                    component="img"
                                                    src={`${API_URL}/api/` + mask} // Adjust the path to your colored mask
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '150px',
                                                        height: '150px',
                                                        visibility: (invert && isMaskList[idx]) ? 'hidden' : 'visible'
                                                    }}
                                                    ref={(refNode) => {
                                                        const refPair = {
                                                            'img': refNode
                                                        };
                                                        imageRefCanvasRefPair.current[`${imageIndex}-Inpainted${mask}`] = refPair;
                                                    }}
                                                    crossOrigin="anonymous"
                                                    onLoad={() => {invertImages(`${imageIndex}-Inpainted${mask}`)}}
                                                    alt={`Mask Overlay ${idx}`}
                                                />
                                                <canvas
                                                    ref={(refNode) => {
                                                        imageRefCanvasRefPair.current[`${imageIndex}-Inpainted${mask}`]['canvas'] = refNode;
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '150px',
                                                        height: '150px',
                                                        visibility: (invert && isMaskList[idx]) ? 'visible' : 'hidden',
                                                    }}
                                                />
                                            </>
                                        ))}
                                    </Box>
                                  
                                </Box>
                            </Stack>
                        )
                    })
                }
            </Box>
        </Box>
    )
};

export {
    ImageMask,
    getMaskPathFromKeywords,
}