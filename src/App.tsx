
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import Portfolio from './components/Portfolio';
import "./App.css"
function App() {
  ModuleRegistry.registerModules([AllCommunityModule]);
  return (
    <>
      <Portfolio />
    </>
  )
}

export default App
