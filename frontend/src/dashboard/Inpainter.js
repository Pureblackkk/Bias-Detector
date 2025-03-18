import React, { useEffect, useState } from 'react';
import { Container, Paper, Grid } from '@mui/material';
import _ from 'lodash';
import InpaintBlock from './InpainterBlock/index';

const getQueeryAsKey = (solution) => {
    return solution.slice(1).map(s => {
        if (s[0] === "with") {
            return `[with ${s[1]}]`
        } else {
            return `[without ${s[1].join(" and ")}]`
        }
    }).join(" and ");
}

const Inpainter = ({
    dataset,
    solutions,
    setSolutions,
    solutionsStatus,
    setSolutionsStatus,
    normalImages,
    panoptic,
    panopticCategories,
    label,
    handleBack,
}) => {
    const updateSolutionStatus = () => {
        const newStatus = _.cloneDeep(solutionsStatus);

        // Check for new solutions status
        solutions.forEach((solution) => {
            const queryKey = getQueeryAsKey(solution);
            if (!(queryKey in solutionsStatus)) {
                newStatus[queryKey] = false;
            }
        })

        setSolutionsStatus(newStatus);
    };

    useEffect(() => {
        updateSolutionStatus();
    }, [])

    useEffect(() => {
        updateSolutionStatus();
    }, [solutions]);

    const deleteSolution = (solIndex) => {
        const newSolutions = solutions?.filter((_, idx) => idx !== solIndex);
        setSolutions(newSolutions);

        // If no solution back to previous stage
        if (newSolutions.length === 0) {
            handleBack();
        }
    }

    const setSolutionDone = (solQuery) => {
        const newStatus = _.cloneDeep(solutionsStatus);
        newStatus[solQuery] = true;
        setSolutionsStatus(newStatus);
    };

    // Ranked solutions by status
    const undoneForShow = [];
    const doneForShow = [];
    solutions.forEach((sol, idx) => {
        if (!solutionsStatus[getQueeryAsKey(sol)]) {
            undoneForShow.push({
                idx,
                sol,
            }) 
        } else{
            doneForShow.push({
                idx,
                sol,
            });
        }
    });

    const solForShow = [...undoneForShow, ...doneForShow];

    return (
        <Grid item xs={12} sx={{ height: 'auto'}}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column'}}>
                <div>
                    <Container maxWidth="false" sx={{
                        overflowY: 'auto',
                        height: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px'
                    }}>
                        {solForShow.map(({sol, idx}) => 
                            <InpaintBlock
                                solution={sol}
                                status={solutionsStatus[getQueeryAsKey(sol)]}
                                setSolutionDone={setSolutionDone}
                                solIndex={idx}
                                normalImages={normalImages}
                                panopticCategories={panopticCategories}
                                panoptic={panoptic}
                                label={label}
                                dataset={dataset}
                                deleteSolution={() => {
                                    deleteSolution(idx);
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
