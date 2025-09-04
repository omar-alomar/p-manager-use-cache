import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"

export default async function ZoomTestPage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }
  return (
    <div className="zoom-test-container">
      <h1>Zoom Test Page</h1>
      <p>This page helps test the responsive font scaling and zoom optimizations.</p>
      
      <div className="font-size-demo">
        <h2>Font Size Demonstration</h2>
        <p className="text-base">Base text size (should look good at 100% zoom)</p>
        <p className="text-sm">Small text size</p>
        <p className="text-lg">Large text size</p>
        <p className="text-xl">Extra large text size</p>
        <p className="text-2xl">2XL text size</p>
        <p className="text-3xl">3XL text size</p>
        <p className="text-4xl">4XL text size</p>
      </div>
      
      <div className="spacing-demo">
        <h2>Spacing Demonstration</h2>
        <div className="spacing-item">Spacing item 1</div>
        <div className="spacing-item">Spacing item 2</div>
        <div className="spacing-item">Spacing item 3</div>
      </div>
      
      <div className="component-demo">
        <h2>Component Demo</h2>
        <button className="demo-button">Sample Button</button>
        <input type="text" placeholder="Sample input" className="demo-input" />
        <div className="demo-card">
          <h3>Sample Card</h3>
          <p>This card demonstrates the improved spacing and typography.</p>
        </div>
      </div>
      
      <div className="zoom-instructions">
        <h2>Testing Instructions</h2>
        <ol>
          <li>Set your browser zoom to 100%</li>
          <li>Check if the text looks appropriately sized</li>
          <li>Try zooming to 90% and 110% to compare</li>
          <li>The text should remain readable at all zoom levels</li>
        </ol>
      </div>
    </div>
  );
}
