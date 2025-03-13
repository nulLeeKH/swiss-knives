'use client';

import * as React from 'react';
import { useState } from 'react';

interface Option {
  id: string;
  text: string;
  weight: number; // Added weight property (default value 1)
}

export default function Roulette() {
  const [options, setOptions] = useState<Option[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [spinDuration, setSpinDuration] = useState(5); // Spin duration in seconds
  const [showResultModal, setShowResultModal] = useState(false); // Show result modal

  // Define SVG size and resolution constants - reduced size to prevent scrolling
  const SVG_SIZE = 550; // Further reduced from 600 to 550 for better fit in all viewports
  const SVG_VIEWBOX = `0 0 ${SVG_SIZE} ${SVG_SIZE}`;
  const SVG_CENTER = SVG_SIZE / 2;

  // Color calculation function - pastel tones
  const getOptionColor = (index: number, total: number) => {
    const hue = (360 / total) * index;
    return `hsl(${hue}, 80%, 75%)`; // Adjusted brightness to 75% for pastel tones
  };

  // Text color calculation function
  const getTextColor = (index: number, total: number) => {
    const hue = (360 / total) * index;
    return `hsl(${hue}, 70%, 30%)`;
  };

  // Calculate total weight sum
  const getTotalWeight = () => {
    return options.reduce((sum, option) => sum + option.weight, 0);
  };

  // Add multiple options separated by commas
  const addOption = () => {
    if (newOption.trim()) {
      // Split comma-separated text into an array
      const optionsToAdd = newOption
        .split(',')
        .map(text => text.trim())
        .filter(text => text.length > 0);

      if (optionsToAdd.length > 0) {
        // Create new options array
        const newOptions = optionsToAdd.map(text => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: text,
          weight: 1, // Default weight is 1
        }));

        // Add new options to existing options
        setOptions([...options, ...newOptions]);
        setNewOption('');
      }
    }
  };

  // Remove option
  const removeOption = (id: string) => {
    setOptions(options.filter(option => option.id !== id));
  };

  // Update weight
  const updateWeight = (id: string, newWeight: number) => {
    if (newWeight >= 1) {
      setOptions(
        options.map(option => (option.id === id ? { ...option, weight: newWeight } : option))
      );
    }
  };

  // Update text
  const updateText = (id: string, newText: string) => {
    if (newText.trim()) {
      setOptions(
        options.map(option => (option.id === id ? { ...option, text: newText.trim() } : option))
      );
    }
  };

  // Close result modal
  const closeResultModal = () => {
    setShowResultModal(false);
  };

  // Spin the roulette wheel with improved animation
  const spinRoulette = () => {
    if (isSpinning || options.length < 2) return;

    // Start spinning animation
    setIsSpinning(true);

    // Calculate rotation based on random selection with weighted probability
    const totalWeight = getTotalWeight();
    const random = Math.random() * totalWeight;
    let selectedIndex = 0;
    let cumulativeWeight = options[0].weight;

    // Select an option using weighted random selection
    while (random > cumulativeWeight && selectedIndex < options.length - 1) {
      selectedIndex++;
      cumulativeWeight += options[selectedIndex].weight;
    }

    // Find the selected option's position
    const selectedOption = options[selectedIndex];

    // Calculate degrees to spin
    let startRatio = 0;
    for (let i = 0; i < selectedIndex; i++) {
      startRatio += options[i].weight / totalWeight;
    }

    const sectorRatio = selectedOption.weight / totalWeight;
    const midRatio = startRatio + sectorRatio / 2;

    // Calculate rotation to make the selected option end at the top
    const angleToRotate = 360 - midRatio * 360;

    // Add multiple full rotations plus the calculated angle
    const fullSpins = 5; // Number of full rotations before stopping
    const newRotation = rotation + 360 * fullSpins + angleToRotate;

    // Update rotation state for the animation
    setRotation(newRotation);

    // Set the selected option for display after spinning completes
    setSelectedOption(selectedOption.id);

    // Show result after the spin animation finishes
    setTimeout(
      () => {
        setIsSpinning(false);
        setShowResultModal(true);
      },
      spinDuration * 1000 + 100
    ); // Add small buffer to ensure animation completes
  };

  // Automatic text wrapping function
  const getWrappedText = (text: string) => {
    // Limit text length and add ellipsis for very long texts
    const maxLength = 25;
    let processedText = text;

    if (text.length > maxLength) {
      processedText = text.substring(0, maxLength - 3) + '...';
    }

    // Wrap text based on length
    const lines = [];
    let remainingText = processedText;

    // For short text, return as single line
    if (remainingText.length <= 12) {
      return [remainingText];
    }

    // For longer text, split into lines of appropriate length
    while (remainingText.length > 0) {
      const lineLength = Math.min(12, remainingText.length);
      const breakIndex =
        remainingText.length > 12
          ? Math.max(
              remainingText.lastIndexOf(' ', 12),
              remainingText.lastIndexOf('-', 12),
              8 // Fallback if no space or hyphen is found
            )
          : remainingText.length;

      const actualBreakIndex = breakIndex === -1 ? lineLength : breakIndex;
      lines.push(remainingText.substring(0, actualBreakIndex));

      // Remove the text we just added to a line
      remainingText = remainingText.substring(
        actualBreakIndex === remainingText.length ? actualBreakIndex : actualBreakIndex + 1
      );
    }

    // Limit to max 2 lines to save space
    if (lines.length > 2) {
      lines.splice(2, lines.length - 2);
      lines[1] += '...';
    }

    return lines;
  };

  // Calculate sector path
  const calculateSectorPath = (index: number) => {
    const totalWeight = getTotalWeight();

    // Calculate start and end positions of the sector
    let startRatio = 0;
    for (let i = 0; i < index; i++) {
      startRatio += options[i].weight / totalWeight;
    }

    const sectorRatio = options[index].weight / totalWeight;
    const endRatio = startRatio + sectorRatio;

    // Convert to degrees (0 degrees is top, clockwise)
    const startAngle = startRatio * 360;
    const endAngle = endRatio * 360;

    // Ensure small sectors have minimum size
    const minAngleDiff = 1;
    const adjustedEndAngle = startAngle + Math.max(endAngle - startAngle, minAngleDiff);

    // Outer and inner radii
    const outerRadius = SVG_CENTER - 10;
    const innerRadius = SVG_CENTER * 0.08;

    // Convert to radians
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((adjustedEndAngle - 90) * Math.PI) / 180;

    // Outer arc start and end points
    const outerStartX = SVG_CENTER + outerRadius * Math.cos(startRad);
    const outerStartY = SVG_CENTER + outerRadius * Math.sin(startRad);
    const outerEndX = SVG_CENTER + outerRadius * Math.cos(endRad);
    const outerEndY = SVG_CENTER + outerRadius * Math.sin(endRad);

    // Inner arc start and end points
    const innerStartX = SVG_CENTER + innerRadius * Math.cos(endRad);
    const innerStartY = SVG_CENTER + innerRadius * Math.sin(endRad);
    const innerEndX = SVG_CENTER + innerRadius * Math.cos(startRad);
    const innerEndY = SVG_CENTER + innerRadius * Math.sin(startRad);

    // Large arc flag (180 degrees or more)
    const largeArcFlag = adjustedEndAngle - startAngle <= 180 ? 0 : 1;

    // Create SVG path
    return `
      M ${outerStartX} ${outerStartY}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
      L ${innerStartX} ${innerStartY}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEndX} ${innerEndY}
      Z
    `;
  };

  // Render label in SVG
  const renderLabelInSVG = (option: Option, index: number) => {
    // Calculate angle and position
    const totalWeight = getTotalWeight();
    const weightRatio = option.weight / totalWeight;
    const sectorAngle = 360 * weightRatio;

    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (360 * options[i].weight) / totalWeight;
    }

    const midAngle = startAngle + sectorAngle / 2;

    // Distance from center - smaller for small sectors
    const minDistance = SVG_CENTER * 0.45; // Adjusted position (closer to center)
    const maxDistance = SVG_CENTER * 0.65; // Adjusted position (closer to center)

    let distanceFactor;

    if (sectorAngle < 10) {
      distanceFactor = 0; // Very close to center for tiny sectors
    } else if (sectorAngle < 30) {
      distanceFactor = (sectorAngle - 10) / 20;
    } else {
      distanceFactor = 1; // Maximum distance for large sectors
    }

    const distance = maxDistance - (maxDistance - minDistance) * distanceFactor;

    // Calculate label position
    const radians = (midAngle - 90) * (Math.PI / 180);
    const x = SVG_CENTER + Math.cos(radians) * distance;
    const y = SVG_CENTER + Math.sin(radians) * distance;

    // Calculate text size (small sectors get smaller text)
    const minScale = 0.7; // Reduced from 0.8
    const maxScale = 1.0; // Reduced from 1.2
    let scaleFactor;

    if (sectorAngle < 10) {
      scaleFactor = minScale;
    } else if (sectorAngle < 30) {
      scaleFactor = minScale + (maxScale - minScale) * ((sectorAngle - 10) / 20);
    } else {
      scaleFactor = maxScale;
    }

    // Calculate text rotation (always readable direction)
    let textRotation = midAngle;
    if (midAngle > 90 && midAngle < 270) {
      textRotation += 180; // Bottom part rotates 180 degrees
    }

    // Text wrapping
    const lines = getWrappedText(option.text);
    const fontSize = 16 * scaleFactor; // Reduced from 18
    const lineHeight = fontSize * 1.2;

    // Background color and text color
    const backgroundColor = getOptionColor(index, options.length);
    const textColor = getTextColor(index, options.length);
    const weightPercent = ((option.weight / getTotalWeight()) * 100).toFixed(1);

    // Scale the label box based on text length and sector size
    const boxWidth = Math.min(80 * scaleFactor, 80); // Limit max width
    const boxHeight = (25 + (lines.length - 1) * 10) * scaleFactor;

    return (
      <g key={`label-${option.id}`}>
        {/* Background box */}
        <rect
          x={x - boxWidth / 2}
          y={y - boxHeight / 2}
          width={boxWidth}
          height={boxHeight}
          rx={8 * scaleFactor}
          ry={8 * scaleFactor}
          fill="rgba(255, 255, 255, 0.95)"
          stroke={backgroundColor}
          strokeWidth="2"
          transform={`rotate(${textRotation}, ${x}, ${y})`}
        />

        {/* Text content */}
        <text
          x={x}
          y={y - (lines.length > 1 ? 5 : 0) * scaleFactor}
          fontSize={fontSize}
          fontWeight="bold"
          fill={textColor}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${textRotation}, ${x}, ${y})`}
        >
          {lines.map((line, i) => (
            <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight} textAnchor="middle">
              {line}
            </tspan>
          ))}

          {/* Weight display */}
          <tspan x={x} dy={lineHeight} fontSize={fontSize * 0.7} fill={textColor} opacity="0.8">
            {weightPercent}%
          </tspan>
        </text>
      </g>
    );
  };

  // Render selected result modal
  const renderResultModal = () => {
    if (!selectedOption || !showResultModal) return null;

    const selectedOptionObj = options.find(o => o.id === selectedOption);
    if (!selectedOptionObj) return null;

    const optionIndex = options.findIndex(o => o.id === selectedOption);
    const backgroundColor = getOptionColor(optionIndex, options.length);

    return (
      <div className="uk-modal uk-open" style={{ display: 'block' }}>
        {/* Place overlay first with lower z-index */}
        <div
          className="uk-modal-overlay uk-overlay-primary uk-position-fixed uk-position-cover"
          onClick={closeResultModal}
          style={{ zIndex: 980 }}
        ></div>

        {/* Modal dialog with higher z-index */}
        <div
          className="uk-modal-dialog uk-modal-dialog-centered uk-animation-slide-top-small"
          style={{ zIndex: 1000, position: 'relative' }}
        >
          <button
            className="uk-modal-close-default"
            type="button"
            onClick={closeResultModal}
            style={{ zIndex: 1010 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
              <line
                fill="none"
                stroke="#000"
                strokeWidth="1.1"
                x1="1"
                y1="1"
                x2="13"
                y2="13"
              ></line>
              <line
                fill="none"
                stroke="#000"
                strokeWidth="1.1"
                x1="13"
                y1="1"
                x2="1"
                y2="13"
              ></line>
            </svg>
          </button>
          <div
            className="uk-modal-header"
            style={{
              background: `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}90)`,
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          >
            <h2
              className="uk-modal-title uk-text-center"
              style={{ color: '#000', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            >
              Result
            </h2>
          </div>
          <div className="uk-modal-body uk-text-center">
            <h1 style={{ fontSize: '32px', margin: '20px 0', fontWeight: 'bold' }}>
              {selectedOptionObj.text}
            </h1>
            <div className="uk-text-meta">
              Weight: {selectedOptionObj.weight} (
              {((selectedOptionObj.weight / getTotalWeight()) * 100).toFixed(1)}
              %)
            </div>
          </div>
          <div className="uk-modal-footer uk-text-center">
            <button className="uk-button uk-button-primary" onClick={closeResultModal}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="uk-section uk-section-default">
      <div className="uk-container">
        <div className="uk-flex uk-flex-wrap">
          {/* Options Management Section */}
          <div className="uk-width-1-1 uk-width-1-3@m">
            <div className="uk-card uk-card-default uk-card-body">
              <h2 className="uk-card-title">Roulette Options</h2>

              {/* Add Option */}
              <div className="uk-margin">
                <label className="uk-form-label">Add Options (comma separated)</label>
                <div className="uk-form-controls">
                  <div className="uk-inline uk-width-1-1">
                    <input
                      type="text"
                      className="uk-input"
                      placeholder="Enter options"
                      value={newOption}
                      onChange={e => setNewOption(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addOption()}
                    />
                    <button
                      className="uk-button uk-button-primary uk-position-right"
                      onClick={addOption}
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <p className="uk-text-meta uk-margin-small-top">
                    Example: Option1, Option2, Option3
                  </p>
                </div>
              </div>

              {/* Options List */}
              <div className="uk-margin">
                <label className="uk-form-label">Options List</label>
                <div className="uk-height-medium uk-overflow-auto">
                  <table className="uk-table uk-table-small uk-table-divider">
                    <colgroup>
                      <col style={{ width: '50%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '30%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Text</th>
                        <th>Weight</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {options.map(option => (
                        <tr key={option.id}>
                          <td>
                            <input
                              type="text"
                              className="uk-input uk-form-small"
                              value={option.text}
                              onChange={e => updateText(option.id, e.target.value)}
                              placeholder="Option text"
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="uk-input uk-form-small uk-form-width-xsmall"
                              value={option.weight}
                              min="1"
                              onChange={e => updateWeight(option.id, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {' '}
                            {/* Prevent line breaks */}
                            <button
                              className="uk-button uk-button-danger uk-button-small"
                              onClick={() => removeOption(option.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {options.length === 0 && (
                        <tr>
                          <td colSpan={3} className="uk-text-center uk-text-muted">
                            No options available. Please add options.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spin Speed Settings */}
              <div className="uk-margin">
                <label className="uk-form-label">Spin Duration: {spinDuration} seconds</label>
                <div className="uk-form-controls">
                  <input
                    className="uk-range"
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={spinDuration}
                    onChange={e => setSpinDuration(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Label Display Toggle */}
              <div className="uk-margin">
                <label className="uk-form-label">Show Labels</label>
                <div className="uk-form-controls">
                  <label>
                    <input
                      className="uk-checkbox"
                      type="checkbox"
                      checked={showLabels}
                      onChange={() => setShowLabels(!showLabels)}
                    />{' '}
                    Show labels
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Roulette Section */}
          <div className="uk-width-1-1 uk-width-2-3@m">
            <div className="uk-card uk-card-default uk-card-body uk-flex uk-flex-column">
              <h2 className="uk-card-title">Roulette</h2>

              <div
                style={{
                  maxWidth: '550px',
                  margin: '0 auto',
                  width: '100%',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                {options.length === 0 ? (
                  <div
                    style={{
                      border: '2px dashed #ccc',
                      borderRadius: '50%',
                      paddingBottom: '100%',
                      position: 'relative',
                      maxWidth: '550px',
                      maxHeight: '550px',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      Please add options
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        paddingBottom: '100%',
                        position: 'relative',
                        zIndex: 1, // Lower z-index to place other elements behind
                        maxWidth: '550px',
                        maxHeight: '550px',
                      }}
                    >
                      <svg
                        viewBox={SVG_VIEWBOX}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: `rotate(${rotation}deg)`,
                          transition: isSpinning
                            ? `transform ${spinDuration}s cubic-bezier(0.17, 0.84, 0.44, 1)` // Improved easing function
                            : 'transform 0.3s ease-out',
                          pointerEvents: 'none', // Set to ignore click events
                        }}
                      >
                        {/* Roulette outer border */}
                        <circle
                          cx={SVG_CENTER}
                          cy={SVG_CENTER}
                          r={SVG_CENTER - 10}
                          fill="none"
                          stroke="#333"
                          strokeWidth="3"
                        />

                        {/* Roulette sector */}
                        {options.map((option, index) => (
                          <path
                            key={option.id}
                            d={calculateSectorPath(index)}
                            fill={getOptionColor(index, options.length)}
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        ))}

                        {/* Roulette center */}
                        <circle cx={SVG_CENTER} cy={SVG_CENTER} r={SVG_CENTER * 0.08} fill="#333" />

                        {/* Option labels */}
                        {showLabels &&
                          options.map((option, index) => renderLabelInSVG(option, index))}
                      </svg>

                      {/* Arrow */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10, // Above roulette
                          width: '30px',
                          height: '50px',
                          pointerEvents: 'none', // Ignore click events
                        }}
                      >
                        <svg viewBox="0 0 30 50">
                          <polygon points="0,20 15,50 30,20" fill="#d32f2f" />
                          <polygon points="0,20 15,0 30,20" fill="#f44336" />
                        </svg>
                      </div>
                    </div>

                    {/* Roulette control */}
                    <div className="uk-margin-top uk-text-center">
                      <button
                        className="uk-button uk-button-primary uk-button-large"
                        onClick={spinRoulette}
                        disabled={isSpinning || options.length < 2}
                        style={{ position: 'relative', zIndex: 20 }} // Button with higher z-index
                      >
                        {isSpinning ? 'Spinning...' : 'Spin Roulette'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {renderResultModal()}
    </div>
  );
}
