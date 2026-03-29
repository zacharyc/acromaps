import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { Layout } from "./components/Layout/Layout";
import { HomePage } from "./pages/HomePage/HomePage";
import { EventsPage } from "./pages/EventsPage/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage/EventDetailPage";
import { AboutPage } from "./pages/AboutPage/AboutPage";

function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}

export default App;
