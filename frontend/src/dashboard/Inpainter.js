import React from 'react';
import { Container, Paper, Grid } from '@mui/material';
import _ from 'lodash';
import InpaintBlock from './InpainterBlock/index';

const Inpainter = ({
    dataset,
    solutions,
    setSolutions,
    normalImages,
    panoptic,
    panopticCategories,
    label,
    handleBack,
}) => {
    const deleteSolution = (solIndex) => {
        const newSolutions = solutions?.filter((_, idx) => idx !== solIndex);
        setSolutions(newSolutions);

        // If no solution back to previous stage
        if (newSolutions.length === 0) {
            handleBack();
        }
    }
    
    return (
        <Grid item xs={12} sx={{ height: 'auto'}}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column'}}>
                <div>
                    <h3>Inpainter</h3>
                    <Container maxWidth="false" sx={{
                        overflowY: 'auto',
                        height: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px'
                    }}>
                        {solutions.map((sol, solIndex) => 
                            <InpaintBlock
                                solution={sol}
                                solIndex={solIndex}
                                normalImages={normalImages}
                                panopticCategories={panopticCategories}
                                panoptic={panoptic}
                                label={label}
                                dataset={dataset}
                                deleteSolution={() => {
                                    deleteSolution(solIndex);
                                }}
                            />
                        )}
                    </Container>
                </div>
            </Paper>
        </Grid>
    );
};

export default Inpainter;
