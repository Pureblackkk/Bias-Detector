import React, { useEffect, useRef, useState } from 'react';
import { 
  Box,
  Typography,
  Container,
  Grid,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import _ from 'lodash';

// Components
import Solver from './Solver';
import Keywords from './Keywords';
import Images from './Images';
import Inpainter from './Inpainter';
import PopoverPanel from './Popover';
import Message from './InpainterBlock/Message'
import StageButton from './StageButton';

// Slider effect
import { motion } from "framer-motion";

// API
import API_URL from '../common/api';

/**
 * Create promise for extract json file given path
 * @param {String} path 
 * @returns 
 */
const returnFetchPromise = async (path) => {
  const response = await fetch(`${process.env.PUBLIC_URL}/json/${path}`, {
    headers: {
      accept: 'application/json',
    },
  });

  return await response.json();
};

/**
 * Parse received keywords and lime keywords, then merge
 * @param {*} selectedKeywords 
 * @returns 
 */
const parseKeywordsAndLimeKeywords = (allKeywords, limeKeywords) => {
  return allKeywords?.map((data) => {
    const filerRes = limeKeywords.filter((item) => data.keyword === item.keyword);
    const limeData = filerRes.length === 1 ? filerRes[0] : undefined;
    const hasLimeData = limeData !== undefined;

    return {
      keyword: [data.keyword],
      score: [parseFloat(data.score)],
      accuracy: [parseFloat(data.accuracy)],
      images: [data.images],
      sepcificity: hasLimeData ? [limeData?.sepcificity] : undefined,
      class: hasLimeData ? [limeData?.class] : undefined,
      coefficient: hasLimeData ? [limeData?.coefficient] : undefined,
    };
  });
}

export default function Dashboard() {
  const { dataset, label } = useParams();

  // Define loading data
  const [isDataLoad, setDataLoad] = useState(false);

  // Define the source data
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [selectedPanoptic, setSelectedPanoptic] = useState(null);
  const [selectedPanopticCategories, setSelectedPanopticCategories] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [selectedTrainData, setSelectedTrainData] = useState(null);
  const [selectedRevertedImgInfo, setSelectedRevertedImgInfo] = useState(null);

  // Define postprocessing data
  const [keywords, setKeywords] = useState(null);

  useEffect(() => {
    const fetchJson = async () => {
      try {
        const [
          keywords,
          limeKeywords,
          predictions,
          panoptic,
          panopticCategories,
          coordinates,
          trainData,
          revertedImgInfo,
        ] = await Promise.all([
          returnFetchPromise(`${dataset}/keywords_all.json`),
          returnFetchPromise(`${dataset}/keywords_lime.json`),
          returnFetchPromise(`${dataset}/prediction.json`),
          returnFetchPromise(`${dataset}/panoptic.json`),
          returnFetchPromise(`${dataset}/panoptic_categories.json`),
          returnFetchPromise(`${dataset}/coordinates.json`),
          returnFetchPromise(`${dataset}/file_list.json`),
          returnFetchPromise(`${dataset}/reverted_image.json`),
        ]);
        
        setSelectedPrediction(predictions[label]);
        setSelectedPanoptic(panoptic[label]);
        setSelectedPanopticCategories(panopticCategories[label]);
        setSelectedCoordinates(coordinates[label]);
        setSelectedTrainData(trainData['train'][label]);
        setSelectedRevertedImgInfo(revertedImgInfo[label]);

        // Set post processing keywords
        setKeywords(parseKeywordsAndLimeKeywords(keywords[label], limeKeywords[label]));

        // Set loading flag
        setDataLoad(true);
        console.info('ALL JSON File Loaded!')
      } catch(err) {
        console.error('Loading Json File Failed', err)
      }
    };

    fetchJson();
  }, []);
  
  const [hoveredImages, setHoveredImages] = useState(null);
  const [clickedObj, setClickedObj] = useState({})
  const [solutions, setSolutions] = useState([])
  const [draggedKeywordObj, setDraggedKeywordObj] = useState(null)
  const [keywordMode, setKeywordMode] = useState(false) // for manual keyword generation
  const [selectedImages, setSelectedImages] = useState({})
  const [popover, setPopover] = useState(null)
  const [clickedImage, setClickedImage] = useState(null)
  const [hoveredCaptionKeyword, setHoveredCaptionKeyword] = useState(null)
  const [popoverCollapsed, setPopoverCollapsed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const modalContent = useRef('');

  // Ref for adding the selected image to the keyword select
  const updatingImagesToKeywordsRef = useRef(undefined);

  const registerManualKeyword = function (isCanel, expectedMode, updatingFunction) { // User add new keyword
    if (!!isCanel) {
      setSelectedImages({});
      setKeywordMode(false);
      return;
    }

    if (keywordMode == false) {
      setKeywordMode(expectedMode);
      if (updatingFunction) {
        updatingImagesToKeywordsRef.current = updatingFunction;
      }
      return;
    }

    if (keywordMode == 'Adding' || keywordMode == 'Deleting') {
      // Adding the image to current keyword
      const images = Object.entries(selectedImages).filter(([key, value]) => value).map(([key, value]) => key);
      updatingImagesToKeywordsRef.current?.(images);
      updatingImagesToKeywordsRef.current = undefined;
      setKeywordMode(false);
    }

    if (keywordMode == "Manual") {
      const newKeyword = prompt("Please enter the new bias keyword", "e.g. grassfield")
      if (newKeyword != null) {
        setModalOpen(true)
        modalContent.current = 'Keyword CLIP Score calculating..., please wait';

        const images = Object.entries(selectedImages).filter(([key, value]) => value).map(([key, value]) => key)
        fetch(`${API_URL}/api/manual_keyword`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          mode: "cors",
          body: JSON.stringify({
            keyword: newKeyword,
            dataset: dataset,
            classname: label,
            images: images
          })
        }).then(response => response.json())
          .then(data => {
            const newKeywordObj = {
              keyword: [newKeyword],
              score: [Number(data["score"])],
              accuracy: [Number(data["accuracy"])],
              images: [images]
            }
            setSelectedImages({})
            setKeywords([...keywords, newKeywordObj])
            setKeywordMode(false)
            setModalOpen(false)
            modalContent.current = '';
          })
      }
    }
  }

  const registerComplete = (dragCompletedKeywordObj) => {
    setKeywords(keywords.filter((k, index) => index != dragCompletedKeywordObj.index))
    setDraggedKeywordObj(null)
  }

  const mergeComplete = () => {
    setDraggedKeywordObj(null)
  }

  const handleForward = () => {
    setStageIndex((prev) => Math.min(prev + 1, StageMapList.length - 1));
  };

  const handleBack = () => {
    setStageIndex((prev) => Math.max(prev - 1, 0));
  };

  // Define stage componets
  const ImagesPanel = () => {
    return (
      <>
        {/* Images */}
        <Images
          stageIndex={stageIndex}
          clickedImage={clickedImage}
          setClickedImage={setClickedImage}
          prediction={selectedPrediction}
          hoveredImages={hoveredImages}
          clickedObj={clickedObj}
          coordinates={selectedCoordinates}
          keywordMode={keywordMode}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          setPopover={setPopover}
          keywords={keywords}
          registerManualKeyword={registerManualKeyword}
        />
      </>
    );
  };

  const CaptionPanel = () => {
    return (<>
      <PopoverPanel
        stageIndex={stageIndex}
        popover={popover}
        setHoveredCaptionKeyword={setHoveredCaptionKeyword}
        popoverCollapsed={popoverCollapsed}
        setPopoverCollapsed={setPopoverCollapsed}
      />
    </>);
  };

  const KeywordsPanel = () => {
    return (<>
      <Keywords
        stageIndex={stageIndex}
        dataset={dataset}
        popoverCollapsed={popoverCollapsed}
        label={label}
        keywords={keywords}
        setKeywords={setKeywords}
        setHoveredImages={setHoveredImages}
        prediction={selectedPrediction}
        setClickedObj={setClickedObj}
        mergeComplete={mergeComplete}
        coordinates={selectedCoordinates}
        setDraggedKeywordObj={setDraggedKeywordObj}
        draggedKeywordObj={draggedKeywordObj}
        registerManualKeyword={registerManualKeyword}
        keywordMode={keywordMode}
        popover={popover}
        clickedImage={clickedImage}
        hoveredCaptionKeyword={hoveredCaptionKeyword}
        selectedRevertedImgInfo={selectedRevertedImgInfo}
      />
    </>);
  };

  const SolverPanel = () => {
    return (<>
     <Solver
        solutions={solutions}
        stageIndex={stageIndex}
        predictions={selectedPrediction}
        setSolutions={setSolutions}
        registerComplete={registerComplete}
        draggedKeywordObj={draggedKeywordObj}
        setKeywords={setKeywords}
        selectedTrainData={selectedTrainData}
        handleForward={handleForward}
      />
    </>);
  };

  const InpainterPanel = () => {
    return (<>
      <Inpainter
        stageIndex={stageIndex}
        dataset={dataset}
        solutions={solutions}
        setSolutions={setSolutions}
        normalImages={selectedTrainData}
        panoptic={selectedPanoptic}
        panopticCategories={selectedPanopticCategories}
        label={label}
        handleBack={handleBack}
      />
    </>);
  };

  const StageMapList = [
    [ImagesPanel, CaptionPanel, KeywordsPanel],
    [KeywordsPanel, SolverPanel],
    [InpainterPanel],
  ];

  const shouldHaveForwardButton = (() => {
    if (stageIndex === StageMapList.length - 1) return false;
    if (stageIndex ===1 && solutions.length === 0) return false;
    return true;
  })();

  const shouldHaveBackButton = stageIndex !== 0;

  return isDataLoad ? (
    <div className="App">
      <Box sx={{
        backgroundColor: "rgba(0, 28, 76, 0.8)",
        justifyContent: "space-start",
        paddingLeft: '30px',
        alignItems: "center",
        display: "flex",
        height: "50px",
        color: "white",
        fontFamily: 'Inter',
        fontStyle: 'italic',
      }}>
        <Typography variant="h5" noWrap component="div">
          Bias Balancer
        </Typography>
      </Box>

      {/* Motion container */}
      <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'hidden !important'}}>
        <Box
          component={motion.div}
          key={stageIndex}
          initial={{ opacity: 0, x: 50}}
          animate={{ opacity: 1, x: 0}}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", stiffness: 120 }}
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: 'calc(100vh - 50px)',
            overflow: 'hidden !important',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', overflow: 'hidden', width: '100%', height: '100%' }}>
            <Container sx={{ mt: 1, mb: 1, minWidth: "100vw"}}>
              <Grid container spacing={1}  sx={{
                justifyContent: "center",
              }} >
                {
                  StageMapList?.[stageIndex].map((panelRender) => panelRender())
                }
              </Grid>
            </Container>
          </Box>
        </Box>
      </Box>

      {/* Set stage button */}
      {
        shouldHaveForwardButton && <StageButton direction={'right'} onClick={handleForward}/>
      }
      {
        shouldHaveBackButton && <StageButton direction={'left'} onClick={handleBack}/>
      }
      <Message modalOpen={modalOpen} modalContent={modalContent}></Message>
    </div >
    // </ThemeProvider>
  ) : <div>Loading------Loading</div>
}
