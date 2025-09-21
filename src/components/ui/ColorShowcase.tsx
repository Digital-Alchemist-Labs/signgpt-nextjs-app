import React from "react";

export default function ColorShowcase() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Color Showcase</h1>
      <div className="space-y-8">
        {/* Light mode containers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Output Containers (Light Mode)
          </h2>
          <div className="output-container p-4 rounded-lg border">
            <p>
              This is an output container with the new darker background in
              light mode
            </p>
          </div>
          <div className="bg-muted p-4 rounded-lg border">
            <p>This is a regular muted container for comparison</p>
          </div>
        </div>

        {/* Background examples */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Background Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background p-4 rounded-lg border">
              <p className="text-foreground">Background</p>
            </div>
            <div className="bg-muted p-4 rounded-lg border">
              <p className="text-muted-foreground">Muted</p>
            </div>
            <div className="output-container p-4 rounded-lg border">
              <p className="text-foreground">Output Container</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg border">
              <p className="text-secondary-foreground">Secondary</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
