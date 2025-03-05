import React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/slice/menuSlice";
import { socket } from "@/socket";
import styles from "./index.module.css";
import { useRouter } from "next/router";

const Board = () => {
  const router = useRouter();
  const { room } = router.query;
  
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
      context.fillStyle = "#202124";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Broadcast clear canvas to all users in the room
      socket.emit("clearCanvas", { room });
    } else if (
      actionMenuItem === MENU_ITEMS.UNDO ||
      actionMenuItem === MENU_ITEMS.REDO
    ) {
      if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO)
        historyPointer.current -= 1;
      else if (
        historyPointer.current < drawHistory.current.length - 1 &&
        actionMenuItem === MENU_ITEMS.REDO
      )
        historyPointer.current += 1;
      else return;

      const imageData = drawHistory.current[historyPointer.current];
      context.putImageData(imageData, 0, 0);
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
      context.fillStyle = "#202124";
      context.fillRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("changeConfig", handleChangeConfig);
      socket.off("clearCanvas");
    };
  }, [color, size, room]);

  // before browser paint
  useLayoutEffect(() => {
    if (!canvasRef.current || !room) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    function setCanvasSize() {
      canvas.width = window.innerWidth * 0.6; // Adjust canvas size to fit the board area
      canvas.height = window.innerHeight * 0.8;
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
      shouldDraw.current = true;
      const x = e.clientX || e.touches[0].clientX;
      const y = e.clientY || e.touches[0].clientY;
      
      beginPath(x, y);
      
      // Emit beginPath with room and style info
      socket.emit("beginPath", {
        room,
        x,
        y,
        color,
        size
      });
    };

    const handleMouseMove = (e) => {
      if (!shouldDraw.current) return;
      const x = e.clientX || e.touches[0].clientX;
      const y = e.clientY || e.touches[0].clientY;
      
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
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current.push(imageData);
      historyPointer.current = drawHistory.current.length - 1;
    };

    const handleBeginPath = (path) => {
      // Apply the style from the remote user
      context.strokeStyle = path.color;
      context.lineWidth = path.size;
      beginPath(path.x, path.y);
    };

    const handleDrawLine = (path) => {
      drawLine(path.x, path.y);
    };

    // Listen for drawing events from other users
    socket.on("beginPath", handleBeginPath);
    socket.on("drawLine", handleDrawLine);
    
    // Listen for room history to load existing drawings
    socket.on("roomHistory", (data) => {
      if (data.drawing && data.drawing.length > 0) {
        // Replay the drawing history
        data.drawing.forEach(item => {
          if (item.type === 'beginPath') {
            context.strokeStyle = item.color;
            context.lineWidth = item.size;
            beginPath(item.x, item.y);
          } else if (item.type === 'drawLine') {
            drawLine(item.x, item.y);
          }
        });
      }
    });

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchmove", handleMouseMove);
    canvas.addEventListener("touchend", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);

      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchmove", handleMouseMove);
      canvas.removeEventListener("touchend", handleMouseUp);

      socket.off("beginPath", handleBeginPath);
      socket.off("drawLine", handleDrawLine);
      socket.off("roomHistory");
      
      window.removeEventListener("resize", setCanvasSize);
    };
  }, [room, color, size]);

  return (
    <div className={styles.canvasContainer}>
      <canvas ref={canvasRef} className={styles.canvas}></canvas>
    </div>
  );
};

export default Board;
