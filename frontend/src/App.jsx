import { useState } from "react";
import MainMenu from "./components/MainMenu";
import AddressSearchPage from "./components/AddressSearchPage";
import XmlParkingCompare from "./components/XmlParkingCompare";

function App() {
  const [page, setPage] = useState("menu"); // "menu" | "address" | "parking"

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {page === "menu" && <MainMenu onNavigate={setPage} />}

      {page === "address" && (
        <AddressSearchPage onBack={() => setPage("menu")} />
      )}

      {page === "parking" && (
        <XmlParkingCompare onBack={() => setPage("menu")} />
      )}
    </div>
  );
}

export default App;