import React, { useEffect, useRef, useState } from "react";
import { Box, Paper, Typography, Grid, Card, CardContent, Divider, IconButton } from "@mui/material";
import LeftIcon from '@mui/icons-material/ArrowLeft';
import RightIcon from '@mui/icons-material/ArrowRight';

export default function PopoverPanel({ popover, glyphMode, setHoveredCaptionKeyword, popoverCollapsed, setPopoverCollapsed }) {
  const [maxHeight, setMaxHeight] = useState("85vh");
  const [panel, setPanel] = useState(1);

  const ref = useRef(null);
  const imgRef = useRef(null);
  const captionRef = useRef(null);

  useEffect(() => {
    if (ref.current) {
      const elementHeight = ref.current.clientHeight;
      const availableHeight = window.innerHeight * 0.85 - elementHeight;
      setMaxHeight(`${availableHeight}px`);
    }

  }, [popover]);


  const generateTrianglePath = (section) => {
    if (section === "left") {
      // Left triangle: top left (0,0), bottom left (0,imageSize), center (imageSize/2, imageSize/2)
      return `M0,0 L0,100 L50,50 Z`;
    } else if (section === "right") {
      // Right triangle: top right (imageSize,0), bottom right (imageSize,imageSize), center (imageSize/2, imageSize/2)
      return `M100,0 L100,100 L50,50 Z`;
    } else if (section === "top") {
      // Top triangle: top left (0,0), top right (imageSize,0), center (imageSize/2, imageSize/2)
      return `M0,0 L100,0 L50,50 Z`;
    } else if (section === "down") {
      // Down triangle: bottom left (0,imageSize), bottom right (imageSize,imageSize), center (imageSize/2, imageSize/2)
      return `M0,100 L100,100 L50,50 Z`;
    }
  }

  useEffect(() => {
    const captionContainer = captionRef.current;
    if (!captionContainer) return;

    const handleMouseEnter = (event) => {
      if (event.target.tagName === "SPAN") {
        setHoveredCaptionKeyword(event.target.textContent);
      }
    };

    const handleMouseLeave = () => {
      setHoveredCaptionKeyword(null);
    };

    // Attach event listeners to all span elements inside caption
    captionContainer.addEventListener("mouseover", handleMouseEnter);
    captionContainer.addEventListener("mouseout", handleMouseLeave);

    return () => {
      captionContainer.removeEventListener("mouseover", handleMouseEnter);
      captionContainer.removeEventListener("mouseout", handleMouseLeave);
    };
  }, [popover?.caption]);

  return (
    <Grid item xs={12} md={4} lg={popoverCollapsed ? 0.2 : 2}>
      <IconButton onClick={() => setPopoverCollapsed(!popoverCollapsed)} sx={{ p: 0 }}>
        {popoverCollapsed ? <RightIcon /> : <LeftIcon />}
      </IconButton>
      {/* Image Section */}
      {!popoverCollapsed && (
        <div
          sx={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "85vh",
            overflowY: "auto",
            borderRadius: "12px",
            backgroundColor: "transparent"
          }}
        >
          <Card ref={ref} sx={{ mb: 1, borderRadius: "12px", maxHeight: "50vh" }}>
            <CardContent>
              <Typography variant="h6">Image Preview</Typography>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" justifyContent="center">
                {popover && 
                <svg
                  ref={imgRef}
                  width="90%"
                  height="auto"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid slice"
                  style={{ borderRadius: "8px" }}
                >
                  <image href={popover.image} width="100%" height="100%" />
                  {glyphMode=='location' && <path d={generateTrianglePath(popover.triangle, 100)} opacity={0.7} fill="#606060" stroke='black'></path>}             
                </svg>}
              </Box>
            </CardContent>
          </Card>

          {/* Caption Section */}
          <Card sx={{ my: 1, borderRadius: "12px", maxHeight: maxHeight, overflowY: "auto" }}>
            <CardContent>
              <Typography variant="h6">
                <span
                  style={{ color: panel === 1 ? "black" : "gray", cursor: "pointer" }}
                  onClick={() => setPanel(1)}
                >
                  Caption
                </span>{" "}
                {/* &nbsp;| &nbsp;
                <span
                  style={{ color: panel === 2 ? "black" : "gray", cursor: "pointer" }}
                  onClick={() => setPanel(2)}
                >
                  Keywords
                </span> */}
              </Typography>
              {panel === 1 ? (
                <>
                  <Typography variant="h7">LLM-generated Caption</Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body1" ref={captionRef}>
                    {popover?.caption}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h7">Bias Keyword Information</Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body1">{popover?.details || "No additional details available."}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Grid>
  );
}

