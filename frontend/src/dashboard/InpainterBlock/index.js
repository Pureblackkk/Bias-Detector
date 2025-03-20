import React, { useState, useRef } from 'react';
import {
    Paper,
    TextField,
    Stack,
    Typography,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Divider,
    Alert,
    Snackbar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import _ from 'lodash';
import { ImageMask, getMaskPathFromKeywords } from './ImageMask';
import Shortcut from './Shortcut';
import Overlay from './Shortcut/overlay';
import useImagePanoptic from './hooks/image-panoptic';
import Message from './Message';
import Drawer from './Drawer';
import {
    callInpaintAPI,
    callGenerateMaskAPI,
} from './api';
import CloseIcon from '@mui/icons-material/Close';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import { color } from 'd3';

// Generate query with the given query
const generateQuery = (solution) => {
    return solution.slice(1).map(s => {
        if (s[0] === "with") {
            return `[with ${s[1]}]`
        } else {
            return `[without ${s[1].join(" and ")}]`
        }
    }).join(" and ");
};

const InpaintBlock = ({
    dataset,
    solution,
    solIndex,
    normalImages,
    panoptic,
    panopticCategories,
    label,
    deleteSolution,
    status,
    setSolutionDone,
}) => {
    const [invert, setInvert] = useState(false);
    const [numImages, setNumImages] = useState(solution[0]);
    const [finished, setFinished] = useState(false);
    const [drawModalOpen, setDrawModalOpen] = useState(false);
    const drawModalTypeRef = useRef(undefined);
    const [alert, setAlert] = useState({severity: 'success', content: '', open: false});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newMaskDialog, setNewMaskDialog] = useState(false);
    const seemQueryRef = useRef(null);
    const queryRef = useRef(null);

    // Get image, mask related variable
    const {
        filerMaskedImage,
        updateMaskedImage,
        panopticInUse,
        updatePanoptic,
        selectedImgURL,
        selectedKeywords,
        updateKeywords,
        categoriesNumPair,
        manualKeywords,
        updateManualKeyword,
        overlayKeywords,
        updateOverlayKeyword,
        reloadImageBatch,
        modalOpen,
        modalContent,
        updateModal,
    } = useImagePanoptic(
        dataset,
        panoptic,
        normalImages,
        panopticCategories,
        10,
    )

    const generateMask = function (e) {
        const prompt = seemQueryRef.current.value;
        if (prompt === '' || !prompt) return;

        // Filter the image who has already has generated mask
        const filteredURL = filerMaskedImage(prompt, selectedImgURL);
        if (filteredURL?.length <= 0) return;

        // Call the message modal
        updateModal(
            true,
            'Generating Masks..., please wait!',
        );
        
        callGenerateMaskAPI(
            dataset,
            prompt,
            filteredURL,
        )
        .then(maskPaths => {
            // Update panoptic
            updatePanoptic(
                filteredURL,
                maskPaths,
                prompt,
            );

            // Update manual keywords
            updateManualKeyword(prompt);

            // Update generated mask-img pair
            updateMaskedImage(prompt, filteredURL);

            // Update message modal
            updateModal(false, '');

            // Close dialog
            setNewMaskDialog(false);
        })
    }

    const inpaint = function (e) {
        if (selectedKeywords.size === 0) {
            setAlert({
                content: 'You haven\'t mave any mask yet...',
                severity: 'error',
                open: true,
            });
            return;
        }

        updateModal(
            true,
            'Recording inpaint command..., please wait',
        );
        callInpaintAPI({
            batch_mask: selectedImgURL.map((imgURL) => {
                if (selectedKeywords.size > 0) {
                    return getMaskPathFromKeywords(
                        selectedKeywords,
                        panopticInUse[imgURL],
                    );
                }
                return '';
            }),
            keywords: Array.from(selectedKeywords),
            invert,
            solution: numImages,
            solution_query: queryRef.current.value,
            dataset: dataset,
            class_name: label,
        })
        .then(() => {
            updateModal(false, '');
            setAlert({
                content: 'Action recored successfully!',
                severity: 'success',
                open: true,
            });

            // Set done flag
            setSolutionDone(generateQuery(solution));
        });
    };

    const handleDiaglogOpen = () => setDialogOpen(true);
    const handleDialogClose = () => setDialogOpen(false);

    const handleDialogConfirm = () => {
        // Delete current solution
        deleteSolution();
        setDialogOpen(false);
    };

    return (
        <Paper key={solIndex}>
            <Paper sx={{ p: 2, position: 'relative'}}>
                <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                    <Typography component="span" variant="h5" sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        fontWeight: 600,
                    }}>
                        {`Inpainter`}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        <Typography component="span" variant="h6" sx={{ display: "inline", color: 'rgba(58, 102, 65, 1)', marginRight: '15px'}}>
                            {`Solution ${solIndex + 1}:`}
                        </Typography>
                        Generate <TextField
                            variant="standard"
                            value={numImages}
                            onChange={e => setNumImages(parseInt(e.target.value) || 0)}
                            sx={{width: '90px'}}
                            inputProps={{ style: { textAlign: 'center' } }} 
                        /> images {generateQuery(solution)}
                    </Typography>

                    {/* Close Icon */}
                    <IconButton
                        onClick={handleDiaglogOpen}
                        sx={{
                            position: 'absolute',
                            top: -20,
                            right: 0,
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                </Stack>
                <Typography sx={{ mb: 1 }} variant="caption" gutterBottom>
                    *Note: The number is calculated automatically to ensure best optimization.
                </Typography>
                
                {/* Block for operation panel */}
                <Stack direction="row" spacing={3} sx={{ my: 2, width: '100%' }}>
                    {/* Mask */}
                    <Stack direction="row" spacing={3} sx={{ pl: 2, pr: 2, my: 2, boxShadow: 3, minWidth: '56vw', flex: "1 1 auto"}}>
                        <Box key="-1" component="div" sx={{ width: '160px', maxHeight: '100px' }} >
                            <Stack direction="column" spacing={1} alignItems='center' justifyContent='center' height='100%'>
                                <Button size="small" sx={{ width: '170px', fontSize: '12px', textTransform: "none" }} variant="contained" onClick={(e) => setNewMaskDialog(true)}>
                                    Segment New Mask
                                </Button>
                                <Button size="small" sx={{ width: '170px', fontSize: '12px', textTransform: "none" }} variant="contained" onClick={(e) => {
                                    drawModalTypeRef.current = 'draw';
                                    setDrawModalOpen(true);
                                }}>
                                    Manually Draw Mask
                                </Button>
                            </Stack>
                        </Box>
                        <Shortcut
                            solIndex={solIndex}
                            selectedKeywords={selectedKeywords}
                            updateKeywords={updateKeywords}
                            categoriesNumPair={categoriesNumPair}
                            manualKeywords={manualKeywords}
                            finished={finished}
                            totalCount={normalImages.length}
                        />
                    </Stack>

                    {/* Overlay */}
                    <Stack direction='row' justifyContent='flex-end' spacing={3} sx={{pl: 2, pr: 3, my: 2, boxShadow: 3, maxWidth: '24vw', flex: '1 1 auto'}} >
                        <Overlay
                            solIndex={solIndex}
                            selectedKeywords={selectedKeywords}
                            updateKeywords={updateKeywords}
                            overlayKeywords={overlayKeywords}
                            finished={finished}
                        />
                        <Box key="-1" component="div" sx={{ width: '160px', maxHeight: '100px' }} >
                            <Stack sx={{ p: 2 }} spacing={1} alignItems='center' justifyContent='center' >
                                <Button size="small" sx={{ width: '180px', fontSize: '12px', textTransform: "none"}} variant="contained" startIcon={<BrandingWatermarkIcon/>}
                                    onClick={(e) => {
                                        setDrawModalOpen(true);
                                        drawModalTypeRef.current = 'watermark'
                                    }}
                                >
                                    Add Watermark Overlay
                                </Button>
                                <Button size="small" sx={{ width: '180px', fontSize: '12px', textTransform: "none" }} variant="contained" startIcon={<DriveFolderUploadIcon/>}
                                    onClick={(e) => {
                                        setDrawModalOpen(true);
                                        drawModalTypeRef.current = 'upload'
                                    }}>
                                    Upload Picture Overlay
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>
                <Divider />
                
                {/* Block for image and mask */}
                <ImageMask
                    key={solIndex}
                    solIndex={solIndex}
                    selectedImgURL={selectedImgURL}
                    selectedKeywords={selectedKeywords}
                    panoptic={panopticInUse}
                    reloadImageBatch={reloadImageBatch}
                    invert={invert}
                />
                <Divider />
                
                {/* Generate inpainting pannel */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <TextField
                        variant="standard"
                        inputRef={queryRef}
                        fullWidth
                        defaultValue={`A picture ${generateQuery(solution)}`}
                        label="Query for inpainter"
                    />
                    <FormControlLabel control={<Checkbox value={invert} onChange={e => {setInvert(e.target.checked)}} />} label="Invert" />
                    <Button variant="contained" onClick={(e) => inpaint(e, solIndex)}>Inpaint</Button>
                </Box>

                {/* Mask */}
                {status && <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        bgcolor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 2,
                        borderRadius: 1,
                    }}
                />}
            </Paper>
            <Message
                anchor="right"
                modalOpen={modalOpen}
                modalContent={modalContent}
            />
            <Drawer
                modalOpen={drawModalOpen}
                setModalOpen={setDrawModalOpen}
                updateManualKeyword={updateManualKeyword}
                updateOverlayKeyword={updateOverlayKeyword}
                updateMaskedImage={updateMaskedImage}
                selectedImgURL={selectedImgURL}
                updateModal={updateModal}
                updatePanoptic={updatePanoptic}
                drawerType={drawModalTypeRef.current ?? 'draw'}
            />
            <Snackbar
                open={alert.open}
                autoHideDuration={2000}
                onClose={() => setAlert({...alert, open: false})}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={alert.severity}>{alert.content}</Alert>
            </Snackbar>

            {/* Close Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Are you sure you want to delete this solution?"}
                </DialogTitle>
                <DialogContent>
                <DialogContentText id="alert-dialog-description">
                </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleDialogConfirm} autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* New mask dialog */}
            <Dialog
                open={newMaskDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
               
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <DialogTitle id="alert-dialog-title">
                        {"Input a prompt for segmenting new mask"}
                    </DialogTitle>
                    <TextField inputRef={seemQueryRef} sx={{ width: '160px', mb: 1, height: "50px" }} label="New Mask Keyword" variant="standard" />
                </Box>
                <DialogActions>
                    <Button sx={{ textTransform: 'none' }} onClick={(e) => generateMask(e)}>Confirm</Button>
                    <Button sx={{ textTransform: 'none' }} onClick={() => setNewMaskDialog(false)} autoFocus>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default InpaintBlock;
