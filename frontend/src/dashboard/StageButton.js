import React, { useState } from "react";
import { IconButton, Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const StageButton = ({ onClick, direction }) => {
    const [hover, setHover] = useState(false);
    const isRight = direction === 'right';
    const boxStyle = direction === 'right' ? {
        right: -25,
    } : {
        left: -25,
    };
    
    const initialBorderRadius = direction === 'right' ?  '40px 0px 0px 40px' : '0px 40px 40px 0px';

    return (
        <Box
            component={motion.div}
            initial={{ x: 0 }}
            animate={{ x: hover ? -10 : 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            sx={{
                position: "fixed",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 1000,
                ...boxStyle,
            }}
        >
            <Button
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={onClick}
                component={motion.div}
                initial={{
                    width: 35,
                    height: 75,
                    borderRadius: initialBorderRadius,
                }}
                animate={{
                    width: hover ? 100 : 35,
                    height: hover ? 100 : 100,
                    borderRadius: hover ? "50px" : initialBorderRadius,
                    backgroundColor: 'rgba(69, 95, 151, 0.87)',
                }}
                transition={{
                    type: "spring",
                    stiffness: 150 
                }}
                sx={{
                    color: "white",
                    boxShadow: 3,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "visible",
                }}
            >
                { isRight ? <ArrowForwardIosIcon/> : <ArrowBackIosNewIcon/> }
            </Button>
        </Box>
    )
}

export default StageButton;