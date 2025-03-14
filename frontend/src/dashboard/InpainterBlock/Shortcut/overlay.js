import {
    Box,
    Stack,
    Typography,
    LinearProgress
} from '@mui/material';

const Overlay = ({
    solIndex,
    selectedKeywords,
    updateKeywords,
    finished,
    overlayKeywords,
}) => {
    // Combined with manual keywords
    const overlayKeywordsFakePair = Array.from(overlayKeywords)?.map((keyword) => [keyword, 'manual']);

    return (                
        <Stack
            direction="row"
            spacing={1}
            sx={{ overflow: "auto" }}
        >
            {overlayKeywordsFakePair.map(([keyword, num], index) => {
                if (typeof num === 'number' && num <= 0) return null;

                const isHighLighted = selectedKeywords.has(keyword);
                return (
                    <Box>
                        <Box
                            size="small"
                            key={`Category${solIndex}-${index}`}
                            variant={isHighLighted ? "contained" : "outlined"}
                            onClick={(e) => updateKeywords(
                                keyword,
                                isHighLighted ? 'delete' : 'add',
                            )}
                            sx={{
                                px: "15px",
                                py: "7px",
                                height: '60px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                margin: '5px',
                                cursor: finished ? "cursor" : 'pointer',
                                border: '1px solid',
                                borderColor: isHighLighted ? 'transparent' : '#c4c4c4',
                                borderRadius: '4px',
                                backgroundColor: isHighLighted ? '#1976d2' : 'transparent',
                                color: isHighLighted ? 'white' : 'black',
                                textDecoration: 'none',
                                '&:hover': finished ? null : {
                                    backgroundColor: isHighLighted ? '#115293' : '#f5f5f5',
                                    borderColor: isHighLighted ? 'transparent' : '#c4c4c4',
                                },
                                transition: 'background-color 250ms ease-in-out, box-shadow 250ms ease-in-out',
                            }}>
                            {keyword}
                            <br />
                        </Box>
                    </Box>
                )
            })}
        </Stack>
    )
};

export default Overlay;