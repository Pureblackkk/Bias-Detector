import { Box, Stack, Button } from '@mui/material';
import API_URL from '../../../common/api';

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
}) => {
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
                                    sx={{ position: 'relative', width: '150px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <img
                                        src={`${API_URL}/api/static/` + imgURL}
                                        style={{ width: '150px', maxHeight: '150px', marginBottom: '8px' }} // Adjust marginBottom as needed
                                        alt={`Image ${solIndex}-${imageIndex}`}
                                    />
                                    {pathList?.map((mask, idx) => (
                                        <Box
                                            key={`Panoptic${solIndex}-${imageIndex}-${idx}`}
                                            component="img"
                                            src={`${API_URL}/api/` + mask} // Adjust the path to your colored mask
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '150px',
                                                height: '150px',
                                                opacity: isMaskList[idx] ? 0.6 : 1,
                                            }}
                                            alt={`Mask Overlay ${idx}`}
                                        />
                                    ))}
                                </Box>
                                <Box key={`Mask${solIndex}-${imageIndex}`} sx={{ position: 'relative', width: '150px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '150px', maxHeight: '150px', marginBottom: '8px', border: "black 1px" }} />
                                    {pathList?.map((mask, idx) => (
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
                                            }}
                                            alt={`Mask Overlay ${idx}`}
                                        />
                                    ))}
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