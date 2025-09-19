
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 

function App() {
  ModuleRegistry.registerModules([AllCommunityModule]);
  return (
    <>
      <div className="bg-gray-900 text-white min-h-screen p-4">
        <h1 className="text-2xl font-sans">Hello Web3 App</h1>
      </div>
    </>
  )
}

export default App
