"use client";
import React from "react";
import "../app/globals.css";

const LoaderComponent = () => {
  return (
    <div className="typewriter">
      <div className="slide">
        <i></i>
      </div>
      <div className="paper"></div>
      <div className="keyboard"></div>
    </div>
  );
};

export default LoaderComponent;
