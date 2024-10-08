import { useRef, useState, useEffect, useCallback } from 'react';

import Places from './components/Places.jsx';
import { AVAILABLE_PLACES } from './data.js';
import Modal from './components/Modal.jsx';
import DeleteConfirmation from './components/DeleteConfirmation.jsx';
import logoImg from './assets/logo.png';
import { sortPlacesByDistance } from './loc.js';


// this code runs synchronously unlike the navigator api below. it doesn't have 
// any chance to be not executed before other code in app component finishes execution
// and it also don't make any state management that can cause infinite loop
// so no need to use useEffect hook there.
const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
const storedPlaces = storedIds.map((id) =>
  AVAILABLE_PLACES.find((place) => place.id === id)
);


function App() {
  const modal = useRef();
  const selectedPlace = useRef();
  const [availablePlaces, setAvailablePlaces ] = useState([]);
  const [pickedPlaces, setPickedPlaces] = useState(storedPlaces);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //this function will be re-executed each time app component re-renders. 
  // and because this function changes state, it will cause a re-render of
  // app component itself too, thus causing an infinite loop. Use effect hook 
  // prevents this by depending this code's execution on a dependencies array.
  // and also because of useEffect hook now this function will be executed after
  // everything else in the app component finished execution.
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const sortedPlaces = sortPlacesByDistance(
        AVAILABLE_PLACES,
        position.coords.latitude,
        position.coords.longitude
      );
      setAvailablePlaces(sortedPlaces);
    });
  }, []);

  

  function handleStartRemovePlace(id) {
    setIsModalOpen(true);
    selectedPlace.current = id;
  }

  function handleStopRemovePlace() {
    setIsModalOpen(false);
  }

  function handleSelectPlace(id) {
    setPickedPlaces((prevPickedPlaces) => {
      if (prevPickedPlaces.some((place) => place.id === id)) {
        return prevPickedPlaces;
      }
      const place = AVAILABLE_PLACES.find((place) => place.id === id);
      return [place, ...prevPickedPlaces];
    });

    // in this case despite localStorage is also a side effect. this code will not
    // cause an infinite loop. because this code doesn't cpntain any state change 
    // so will not cause a re-render, and also this function will also won't
    // be executed unless the button is clicked; not when the app component re-rendered.
    const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
    if (storedIds.indexOf(id) === -1) {
      localStorage.setItem(
        "selectedPlaces",
        JSON.stringify([id, ...storedIds])
      );
    }
  }

  // when we use a function as a dependency in a useEffect hook we should define 
  // that function with a useCallback hook. with this hook doesn't create the 
  // function again and again everytime the component renders, unless one of the 
  // dependencies in dependencies array of the useCallback hook changes.
  const handleRemovePlace = useCallback(function handleRemovePlace() {
    setPickedPlaces((prevPickedPlaces) =>
      prevPickedPlaces.filter((place) => place.id !== selectedPlace.current)
    );
    setIsModalOpen(false);

    const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
    localStorage.setItem(
      "selectedPlaces",
      JSON.stringify(storedIds.filter((id) => id !== selectedPlace.current))
    );
  }, [])

  return (
    <>
      <Modal open={isModalOpen} onClose={handleStopRemovePlace}> 
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        <Places
          title="I'd like to visit ..."
          fallbackText={'Select the places you would like to visit below.'}
          places={pickedPlaces}
          onSelectPlace={handleStartRemovePlace}
        />
        <Places
          title="Available Places"
          places={availablePlaces}
          onSelectPlace={handleSelectPlace}
          fallbackText={"Fetching places sorted by your location"}
        />
      </main>
    </>
  );
}

export default App;
