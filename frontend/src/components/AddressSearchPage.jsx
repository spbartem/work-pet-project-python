import { useState } from "react";
import StreetSearch from "./StreetSearch";
import HouseSearch from "./HouseSearch";
import FlatList from "./FlatList";
import AccountSearch from "./AccountSearch";
import FlatSearch from "./FlatSearch";
import FlatPage from "./FlatPage";

function AddressSearchPage({ onBack }) {
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);

  const handleStreetSelect = (street) => {
    setSelectedStreet(street);
    setSelectedHouse(null);
    setSelectedFlat(null);
  };

  const handleHouseSelect = (house) => {
    setSelectedHouse(house);
    setSelectedFlat(null);
  };

  const handleFlatSelect = (flat) => {
    setSelectedFlat(flat);
  };

  const handleBackToHouse = () => {
    setSelectedFlat(null);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← В главное меню
        </button>
      )}

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="grid gap-6 md:grid-cols-4">
          <StreetSearch onSelect={handleStreetSelect} />
          <HouseSearch street={selectedStreet} onSelect={handleHouseSelect} />
          <FlatSearch house={selectedHouse} onSelect={handleFlatSelect} />
          <AccountSearch onSelect={handleFlatSelect} />
        </div>

        {selectedFlat ? (
          <FlatPage
            flat={selectedFlat}
            onBack={handleBackToHouse}
            onSelectAccount={handleFlatSelect}
          />
        ) : (
          <FlatList house={selectedHouse} onSelect={handleFlatSelect} />
        )}
      </div>
    </div>
  );
}

export default AddressSearchPage;