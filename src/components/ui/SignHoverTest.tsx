"use client";

import React, { useState } from "react";

export default function SignHoverTest() {
  const [buttons, setButtons] = useState<string[]>([]);
  const [counter, setCounter] = useState(1);

  const addButton = () => {
    setButtons((prev) => [...prev, `Dynamic Button ${counter}`]);
    setCounter((prev) => prev + 1);
  };

  const removeButton = () => {
    setButtons((prev) => prev.slice(0, -1));
  };

  return (
    <div className="p-6 bg-secondary/20 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">SignHover Test Component</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={addButton}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          data-sign-text="add button"
          data-sign-category="button"
          data-sign-description="Add a new dynamic button to test SignHover"
        >
          Add Dynamic Button
        </button>

        <button
          onClick={removeButton}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          data-sign-text="remove button"
          data-sign-category="button"
          data-sign-description="Remove the last dynamic button"
        >
          Remove Button
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Dynamic buttons (should have SignHover when added):
        </p>
        <div className="flex flex-wrap gap-2">
          {buttons.map((buttonText, index) => (
            <button
              key={index}
              className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/80"
              data-sign-text={buttonText.toLowerCase()}
              data-sign-category="button"
              data-sign-description={`Dynamically created button: ${buttonText}`}
            >
              {buttonText}
            </button>
          ))}
        </div>

        {buttons.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No dynamic buttons yet. Click "Add Dynamic Button" to test SignHover
            on new elements.
          </p>
        )}
      </div>

      <div className="mt-4 p-3 bg-muted rounded text-xs">
        <p>
          <strong>Test Instructions:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Hover over existing buttons to see SignHover working</li>
          <li>Click "Add Dynamic Button" to create new elements</li>
          <li>
            Hover over newly created buttons - they should also show SignHover
          </li>
          <li>
            In development mode, elements with SignHover will have green dashed
            outlines
          </li>
        </ul>
      </div>
    </div>
  );
}

