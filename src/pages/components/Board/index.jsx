import React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/slice/menuSlice";
import { socket } from "@/socket";
import styles from "./index.module.css";
import { useRouter } from "next/router";

const Board = ({ canDraw = true }) => {
  const router = useRouter();
  const { room } = router.query;
  const CANVAS_BACKGROUND = "#202124";
  
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const drawHistory = useRef([]);
  const historyPointer = useRef(0);
  const shouldDraw = useRef(false);
  const { activeMenuItem, actionMenuItem } = useSelector((state) => state.menu);
  const { color, size } = useSelector((state) => state.toolbox[activeMenuItem]);

  useEffect(() => {
    if (!canvasRef.current || !room) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
      const URL = canvas.toDataURL();
      const anchor = document.createElement("a");
      anchor.href = URL;
      anchor.download = "sketch.jpg";
      anchor.click();
    } else if (actionMenuItem === MENU_ITEMS.ERASEALL) {
      context.fillStyle = CANVAS_BACKGROUND;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save the cleared canvas to history
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current = [imageData];
      historyPointer.current = 0;
      
      // Broadcast clear canvas to all users in the room
      socket.emit("clearCanvas", { room });
    } else if (
      actionMenuItem === MENU_ITEMS.UNDO ||
      actionMenuItem === MENU_ITEMS.REDO
    ) {
      if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO) {
        historyPointer.current -= 1;
        // Broadcast undo to all users in the room
        socket.emit("actionMenuEvent", { room, action: "undo", historyPointer: historyPointer.current });
      }
      else if (
        historyPointer.current < drawHistory.current.length - 1 &&
        actionMenuItem === MENU_ITEMS.REDO
      ) {
        historyPointer.current += 1;
        // Broadcast redo to all users in the room
        socket.emit("actionMenuEvent", { room, action: "redo", historyPointer: historyPointer.current });
      }
      else return;

      const imageData = drawHistory.current[historyPointer.current];
      if (imageData) {
        context.putImageData(imageData, 0, 0);
      }
    }
    dispatch(actionItemClick(null));
  }, [actionMenuItem, dispatch, room]);

  useEffect(() => {
    if (!canvasRef.current || !room) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const changeConfig = (color, size) => {
      context.strokeStyle = color;
      context.lineWidth = size;
    };

    const handleChangeConfig = (config) => {
      changeConfig(config.color, config.size);
    };
    
    changeConfig(color, size);
    
    // Listen for config changes from other users
    socket.on("changeConfig", handleChangeConfig);
    
    // Listen for canvas clear events
    socket.on("clearCanvas", () => {
      context.fillStyle = CANVAS_BACKGROUND;
      context.fillRect(0, 0, canvas.width, canvas.height);
      // Reset drawing history when canvas is cleared
      drawHistory.current = [context.getImageData(0, 0, canvas.width, canvas.height)];
      historyPointer.current = 0;
    });
    
    // Listen for action menu events (undo/redo)
    socket.on("actionMenuEvent", (data) => {
      if (data.action === "undo" || data.action === "redo") {
        historyPointer.current = data.historyPointer;
        if (drawHistory.current[historyPointer.current]) {
          context.putImageData(drawHistory.current[historyPointer.current], 0, 0);
        }
      }
    });

    return () => {
      socket.off("changeConfig", handleChangeConfig);
      socket.off("clearCanvas");
      socket.off("actionMenuEvent");
    };
  }, [color, size, room]);

  // before browser paint
  useLayoutEffect(() => {
    if (!canvasRef.current || !room) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    function setCanvasSize() {
      canvas.width = window.innerWidth * 0.6;
      canvas.height = window.innerHeight * 0.8;
      
      // Initialize with a black background
      context.fillStyle = CANVAS_BACKGROUND;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save the initial state to history
      const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current = [initialImageData];
      historyPointer.current = 0;
    }
    setCanvasSize();
    
    window.addEventListener("resize", setCanvasSize);

    const beginPath = (x, y) => {
      context.beginPath();
      context.moveTo(x, y);
    };

    const drawLine = (x, y) => {
      context.lineTo(x, y);
      context.stroke();
    };
    
    const handleMouseDown = (e) => {
      if (!canDraw) return;
      
      shouldDraw.current = true;
      
      // Get the canvas bounding rectangle to calculate the correct position
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
      
      // Configure context based on tool
      if (activeMenuItem === MENU_ITEMS.ERASER) {
        // For eraser, use destination-out with a slightly larger size
        context.globalCompositeOperation = 'destination-out';
        // Make the eraser slightly larger than the pencil for better erasing
        context.lineWidth = size * 1.5;
        // Use a round line cap for smoother erasing
        context.lineCap = 'round';
        context.lineJoin = 'round';
      } else {
        // For drawing, use the selected color
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = color;
        context.lineWidth = size;
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
      
      beginPath(x, y);
      
      // Emit beginPath with room and style info
      socket.emit("beginPath", {
        room,
        x,
        y,
        color: activeMenuItem === MENU_ITEMS.ERASER ? 'transparent' : color,
        size: activeMenuItem === MENU_ITEMS.ERASER ? size * 1.5 : size,
        isEraser: activeMenuItem === MENU_ITEMS.ERASER
      });
    };

    const handleMouseMove = (e) => {
      if (!canDraw || !shouldDraw.current) return;
      
      // Get the canvas bounding rectangle to calculate the correct position
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
      
      drawLine(x, y);
      
      // Emit drawLine with room info
      socket.emit("drawLine", {
        room,
        x,
        y
      });
    };

    const handleMouseUp = (e) => {
      shouldDraw.current = false;
      
      // Reset to default drawing state
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = color;
      context.lineWidth = size;
      
      // Save the current state to history
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // If we're not at the end of the history, truncate it
      if (historyPointer.current < drawHistory.current.length - 1) {
        drawHistory.current = drawHistory.current.slice(0, historyPointer.current + 1);
      }
      
      drawHistory.current.push(imageData);
      historyPointer.current = drawHistory.current.length - 1;
    };

    const handleBeginPath = (path) => {
      // Apply the style from the remote user
      context.lineWidth = path.size;
      
      // Set composite operation based on whether it's an eraser
      if (path.isEraser) {
        context.globalCompositeOperation = 'destination-out';
        context.lineCap = 'round';
        context.lineJoin = 'round';
      } else {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = path.color;
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
      
      beginPath(path.x, path.y);
    };

    const handleDrawLine = (path) => {
      drawLine(path.x, path.y);
    };

    // Listen for menu item changes from other users
    socket.on("menuItemChange", (data) => {
      // This is handled by Redux, no need to do anything here
    });

    // Listen for drawing events from other users
    socket.on("beginPath", handleBeginPath);
    socket.on("drawLine", handleDrawLine);
    
    // Listen for room history to load existing drawings
    socket.on("roomHistory", (data) => {
      if (data.drawing && data.drawing.length > 0) {
        // Replay the drawing history
        data.drawing.forEach(item => {
          if (item.type === 'beginPath') {
            context.lineWidth = item.size;
            
            // Set composite operation based on whether it's an eraser
            if (item.isEraser) {
              context.globalCompositeOperation = 'destination-out';
              context.lineCap = 'round';
              context.lineJoin = 'round';
            } else {
              context.globalCompositeOperation = 'source-over';
              context.strokeStyle = item.color;
              context.lineCap = 'round';
              context.lineJoin = 'round';
            }
            
            beginPath(item.x, item.y);
          } else if (item.type === 'drawLine') {
            drawLine(item.x, item.y);
          }
        });
        
        // Reset composite operation to default
        context.globalCompositeOperation = 'source-over';
        
        // Save the replayed drawing to history
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        drawHistory.current = [imageData];
        historyPointer.current = 0;
      }
    });

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp); // Add this to handle mouse leaving canvas

    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchmove", handleMouseMove);
    canvas.addEventListener("touchend", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);

      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchmove", handleMouseMove);
      canvas.removeEventListener("touchend", handleMouseUp);

      socket.off("beginPath", handleBeginPath);
      socket.off("drawLine", handleDrawLine);
      socket.off("roomHistory");
      socket.off("menuItemChange");
      
      window.removeEventListener("resize", setCanvasSize);
    };
  }, [room, color, size, activeMenuItem, canDraw]);

  return (
    <div className={styles.canvasContainer}>
      <canvas ref={canvasRef} className={styles.canvas}></canvas>
      {!canDraw && (
        <div className={styles.cannotDrawOverlay}>
          <p>You are guessing now</p>
        </div>
      )}
    </div>
  );
};

export default Board;
