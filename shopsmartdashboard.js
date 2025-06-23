import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from 'firebase/firestore';

// --- Firebase Context for global access to DB and Auth instances ---
const FirebaseContext = createContext(null);

// --- Custom Message/Notification Component ---
function Notification({ message, type, onClose }) {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const borderColor = type === 'success' ? 'border-green-700' : 'border-red-700';

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white z-50 transition-transform transform duration-300 ease-out ${bgColor} border ${borderColor}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 focus:outline-none">
          &times;
        </button>
      </div>
    </div>
  );
}

// --- Custom Confirmation Modal Component ---
function ConfirmationModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-sm w-full text-gray-100">
        <p className="text-xl font-semibold mb-6 text-center">{message}</p>
        <div className="flex justify-around space-x-4">
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Shop Overview Section Component ---
function ShopOverviewSection({ setActiveSection, equipmentList, projectsList }) {
  // Shop Health Metrics - derived from real-time data or explicit input
  const shopHealth = {
    overallStatus: 'Good', // Could be 'Good', 'Warning', 'Critical' based on aggregated metrics
    activeProjects: projectsList.filter(p => p.status === 'In Progress').length, // Dynamic from projects data
    maintenanceCompliance: '85%', // Placeholder - would be calculated from maintenance log vs. scheduled tasks
    safetyIncidentsLastMonth: 0, // Placeholder - would be from safety log/AI monitoring
  };

  // Efficiency Metrics - initially 'Collecting Data...' until real-time data integration
  const efficiencyMetrics = {
    // Tool Utilization: Would require IoT sensors (e.g., RFID on tools, power monitoring on bench)
    // or manual check-in/out logging.
    toolUtilization: 'Collecting Data...',
    // Project Completion Rate: Calculated from 'Completed' vs. 'Total' projects,
    // potentially weighted by complexity or estimated time.
    projectCompletionRate: 'Collecting Data...',
    // Rework Rate: Requires tracking of reworks in project/maintenance logs.
    reworkRate: 'N/A',
    // Average Repair Time: Derived from time-stamped maintenance logs for repair tasks.
    avgRepairTime: 'N/A',
  };

  // Inventory Projections - require historical data and AI analysis
  const lowStockItemsCount = equipmentList.filter(item => item.status === 'Needed').length;

  const inventoryProjections = {
    lowStockItems: lowStockItemsCount, // Dynamically linked from equipment status
    // Next Consumable Restock: AI-predicted based on consumption rates from inventory logs (Phonix).
    nextConsumableRestock: 'Analyzing Trends...',
    // Critical Tool Lifespan Remaining: AI-predicted based on usage cycles and maintenance history (Phonix).
    criticalToolLifespanRemaining: 'Assessing Usage...',
    // Upcoming Equipment Acquisitions: Based on equipment status 'Needed' (excluding consumables/salvaged for clarity).
    upcomingEquipmentAcquisitions: equipmentList.filter(item => item.status === 'Needed' && item.category !== 'Consumable (General)' && item.category !== 'Salvaged Component').length,
  };

  // Phonix AI Cluster Status - direct monitoring of the AI infrastructure
  const phonixStatus = {
    clusterStatus: 'Operational', // Monitored by Phonix health checks
    sensorsOnline: '9/10', // From IoT sensor network monitoring
    dataStreamsActive: '5', // From data ingestion pipeline monitoring
    lastAnomalyDetection: 'Monitoring...', // Real-time output from AI anomaly detection models
    aiModelUpdatesDue: '2025-08-01', // Scheduled update for AI models
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition duration-300 hover:shadow-cyan-500/50">
      <h2 className="text-3xl font-semibold text-cyan-300 mb-6 pb-2 border-b border-gray-700">
        Shop Overview & AI Readiness
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-700 p-5 rounded-lg shadow-inner">
          <h3 className="text-xl font-medium text-cyan-200 mb-3">Overall Shop Health</h3>
          <ul className="text-gray-300 space-y-2">
            <li><strong className="text-cyan-400">Status:</strong> {shopHealth.overallStatus}</li>
            <li>
              <strong className="text-cyan-400">Active Projects:</strong> {shopHealth.activeProjects}
              <button onClick={() => setActiveSection('projects')} className="ml-2 text-blue-400 hover:text-blue-300 text-sm underline">
                View Projects
              </button>
            </li>
            <li><strong className="text-cyan-400">Maintenance Compliance:</strong> {shopHealth.maintenanceCompliance}</li>
            <li><strong className="text-cyan-400">Safety Incidents (Last Month):</strong> {shopHealth.safetyIncidentsLastMonth}</li>
          </ul>
        </div>
        <div className="bg-gray-700 p-5 rounded-lg shadow-inner">
          <h3 className="text-xl font-medium text-cyan-200 mb-3">Efficiency Metrics</h3>
          <ul className="text-gray-300 space-y-2">
            <li><strong className="text-cyan-400">Tool Utilization:</strong> {efficiencyMetrics.toolUtilization}</li>
            <li><strong className="text-cyan-400">Project Completion Rate:</strong> {efficiencyMetrics.projectCompletionRate}</li>
            <li><strong className="text-cyan-400">Rework Rate:</strong> {efficiencyMetrics.reworkRate}</li>
            <li><strong className="text-cyan-400">Avg. Repair Time:</strong> {efficiencyMetrics.avgRepairTime}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-700 p-5 rounded-lg shadow-inner">
          <h3 className="text-xl font-medium text-cyan-200 mb-3">Inventory Projections & Timeline</h3>
          <ul className="text-gray-300 space-y-2">
            <li>
              <strong className="text-cyan-400">Low Stock Items:</strong> {inventoryProjections.lowStockItems}
              <button onClick={() => setActiveSection('inventory')} className="ml-2 text-blue-400 hover:text-blue-300 text-sm underline">
                Review Inventory
              </button>
            </li>
            <li><strong className="text-cyan-400">Next Consumable Restock:</strong> {inventoryProjections.nextConsumableRestock}</li>
            <li><strong className="text-cyan-400">Critical Tool Lifespan Remaining:</strong> {inventoryProjections.criticalToolLifespanRemaining}</li>
            <li><strong className="text-cyan-400">Upcoming Equipment Acquisitions:</strong> {inventoryProjections.upcomingEquipmentAcquisitions}</li>
          </ul>
        </div>
        <div className="bg-gray-700 p-5 rounded-lg shadow-inner">
          <h3 className="text-xl font-medium text-cyan-200 mb-3">Phonix AI Cluster Status</h3>
          <ul className="text-gray-300 space-y-2">
            <li><strong className="text-cyan-400">Cluster Status:</strong> {phonixStatus.clusterStatus}</li>
            <li><strong className="text-cyan-400">Sensors Online:</strong> {phonixStatus.sensorsOnline}</li>
            <li><strong className="text-cyan-400">Data Streams Active:</strong> {phonixStatus.dataStreamsActive}</li>
            <li><strong className="text-cyan-400">Last Anomaly Detection:</strong> {phonixStatus.lastAnomalyDetection}</li>
            <li><strong className="text-cyan-400">AI Model Updates Due:</strong> {phonixStatus.aiModelUpdatesDue}</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-gray-700 rounded-lg text-sm text-center text-gray-400">
        This section provides a high-level overview. Detailed data is available in respective 'chapters'.
      </div>
    </div>
  );
}

// --- Equipment Inventory Section Component ---
function EquipmentInventorySection({ equipmentList, showAddForm, setShowAddForm, editingEquipment, handleAddOrUpdateEquipment, handleDeleteEquipment, handleEditClick, setEditingEquipment }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowConfirmModal(true);
  };

  const executeDelete = () => {
    if (itemToDelete) {
      handleDeleteEquipment(itemToDelete.id);
      setItemToDelete(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition duration-300 hover:shadow-blue-500/50">
      <h2 className="text-3xl font-semibold text-blue-300 mb-4 pb-2 border-b border-gray-700">
        Equipment Inventory
      </h2>
      <button
        onClick={() => {
          setShowAddForm(!showAddForm);
          setEditingEquipment(null);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
      >
        {showAddForm ? 'Hide Form' : 'Add New Equipment'}
      </button>

      {showAddForm && (
        <EquipmentForm
          onSave={handleAddOrUpdateEquipment}
          onCancel={() => { setShowAddForm(false); setEditingEquipment(null); }}
          initialData={editingEquipment}
        />
      )}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-inner">
          <thead>
            <tr className="bg-gray-600 text-gray-200 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left rounded-tl-lg">Item Name</th>
              <th className="py-3 px-6 text-left">Category</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Acquisition Date</th>
              <th className="py-3 px-6 text-center rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-light">
            {equipmentList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-400">
                  No equipment added yet. Add some items to get started!
                </td>
              </tr>
            ) : (
              equipmentList.map((item) => (
                <tr key={item.id} className="border-b border-gray-600 hover:bg-gray-650">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{item.name}</td>
                  <td className="py-3 px-6 text-left">{item.category}</td>
                  <td className="py-3 px-6 text-left">{item.status}</td>
                  <td className="py-3 px-6 text-left">{item.acquisitionDate}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-md text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(item)} // Use confirmDelete
                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showConfirmModal && itemToDelete && (
        <ConfirmationModal
          message={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}

// --- AI Integration Section Component ---
function AIIntegrationSection() {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition duration-300 hover:shadow-green-500/50">
      <h2 className="text-3xl font-semibold text-green-300 mb-4 pb-2 border-b border-gray-700">
        AI Integration Concepts & Phonix Cluster
      </h2>
      <ul className="list-disc list-inside text-gray-300 space-y-3">
        <li>
          <strong className="text-green-400">Predictive Maintenance:</strong> AI analyzes usage patterns, test results, and environmental data to predict component failure and schedule proactive maintenance for all workshop tools and equipment.
          <span className="block text-xs text-gray-500 mt-1">Status: Conceptual - Requires sensor integration & data pipelines feeding into 'Phonix'.</span>
        </li>
        <li>
          <strong className="text-green-400">Automated Testing Assistant:</strong> AI guides users through complex test procedures, interprets oscilloscope waveforms, and suggests troubleshooting steps, leveraging 'Phonix' for real-time analysis.
          <span className="block text-xs text-gray-500 mt-1">Status: Conceptual - Requires direct instrument control & ML models on 'Phonix'.</span>
        </li>
        <li>
          <strong className="text-green-400">Workplace Safety Monitor:</strong> AI-powered vision systems (integrated with 'Phonix' IoT) monitor correct ESD practices, tool usage, and identify potential safety hazards in the workshop.
          <span className="block text-xs text-gray-500 mt-1">Status: Future Vision - Requires camera feeds & real-time analytics by 'Phonix'.</span>
        </li>
        <li>
          <strong className="text-green-400">Intelligent Inventory Management:</strong> AI tracks component and consumable consumption, suggests reorders, and optimizes storage based on project needs and historical usage, powered by 'Phonix' data.
          <span className="block text-xs text-gray-500 mt-1">Status: Conceptual - Can integrate with Inventory DB above via 'Phonix' APIs.</span>
        </li>
        <li>
          <strong className="text-green-400">Problem Solving with Available Components:</strong> AI (Phonix) suggests solutions or alternative approaches to repairs/builds based on the currently available components in the inventory.
          <span className="block text-xs text-gray-500 mt-1">Status: Advanced Concept - Requires semantic understanding of components & project requirements.</span>
        </li>
      </ul>
      <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-center text-gray-400">
        The "Phonix" AI cluster aims to unlock higher efficiency, safety, and problem-solving capabilities in the workshop.
      </div>
    </div>
  );
}

// --- Maintenance & Calibration Log Section Component ---
function MaintenanceLogSection() {
  const { db, userId, appId, showMessage } = useContext(FirebaseContext);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [editingMaintenanceEntry, setEditingMaintenanceEntry] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Fetch maintenance data
  useEffect(() => {
    if (db && userId) {
      // Data is stored publicly for multi-user collaboration
      const maintenanceCollectionRef = collection(db, `artifacts/${appId}/public/data/maintenance`);

      const unsubscribe = onSnapshot(maintenanceCollectionRef, async (snapshot) => {
        // Pre-populate if the collection is empty
        if (snapshot.empty) {
          console.log("Maintenance collection is empty, pre-populating with default data.");
          const defaultMaintenanceEntries = [
            { item: 'Multimeter (Fluke 117)', lastService: '2025-01-15', nextDue: '2026-01-15', notes: 'Internal calibration check.' },
            { item: 'Soldering Iron (Weller WES51)', lastService: '2024-12-01', nextDue: '2025-12-01', notes: 'Tip replacement and station cleaning.' },
            { item: 'Air Compressor (20 Gallon)', lastService: '2025-01-20', nextDue: '2025-07-20', notes: 'Oil change and filter inspection.' },
            { item: 'MIG Welder (120V)', lastService: '2025-06-20', nextDue: '2025-09-20', notes: 'Contact tip and nozzle inspection/replacement.' },
            { item: 'Torque Wrench (1/2" Drive)', lastService: '2024-10-01', nextDue: '2026-10-01', notes: 'Annual calibration check.' },
          ];
          const existingDocs = await getDocs(maintenanceCollectionRef);
          if (existingDocs.empty) {
            for (const entry of defaultMaintenanceEntries) {
              await addDoc(maintenanceCollectionRef, entry);
            }
          }
        }

        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by nextDue date
        entries.sort((a, b) => {
          if (a.nextDue && b.nextDue) {
            return new Date(a.nextDue) - new Date(b.nextDue);
          }
          return (a.item || '').localeCompare(b.item || '');
        });
        setMaintenanceList(entries);
        console.log("Maintenance data fetched:", entries);
      }, (error) => {
        console.error("Error fetching maintenance data:", error);
        showMessage(`Error loading maintenance log: ${error.message}`, 'error');
      });

      return () => unsubscribe();
    }
  }, [db, userId, appId, showMessage]);

  const handleAddOrUpdateMaintenance = async (maintenanceData) => {
    if (!db || !userId) {
      showMessage('Database not ready or user not authenticated.', 'error');
      return;
    }
    const maintenanceCollectionRef = collection(db, `artifacts/${appId}/public/data/maintenance`);
    try {
      if (editingMaintenanceEntry) {
        await updateDoc(doc(maintenanceCollectionRef, editingMaintenanceEntry.id), maintenanceData);
        showMessage('Maintenance entry updated successfully!', 'success');
      } else {
        await addDoc(maintenanceCollectionRef, maintenanceData);
        showMessage('Maintenance entry added successfully!', 'success');
      }
      setShowMaintenanceForm(false);
      setEditingMaintenanceEntry(null);
    } catch (e) {
      console.error("Error saving maintenance entry: ", e);
      showMessage(`Error saving maintenance entry: ${e.message}`, 'error');
    }
  };

  const handleDeleteMaintenance = async (id) => {
    if (!db || !userId) {
      showMessage('Database not ready or user not authenticated.', 'error');
      return;
    }
    const maintenanceDocRef = doc(db, `artifacts/${appId}/public/data/maintenance`, id);
    try {
      await deleteDoc(maintenanceDocRef);
      showMessage('Maintenance entry deleted successfully!', 'success');
    } catch (e) {
      console.error("Error deleting maintenance entry: ", e);
      showMessage(`Error deleting maintenance entry: ${e.message}`, 'error');
    }
  };

  const handleEditClick = (entry) => {
    setEditingMaintenanceEntry(entry);
    setShowMaintenanceForm(true);
  };

  const confirmDeleteMaintenance = (entry) => {
    setEntryToDelete(entry);
    setShowConfirmModal(true);
  };

  const executeDeleteMaintenance = () => {
    if (entryToDelete) {
      handleDeleteMaintenance(entryToDelete.id);
      setEntryToDelete(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition duration-300 hover:shadow-orange-500/50">
      <h2 className="text-3xl font-semibold text-orange-300 mb-4 pb-2 border-b border-gray-700">
        Maintenance & Calibration Log
      </h2>
      <button
        onClick={() => {
          setShowMaintenanceForm(!showMaintenanceForm);
          setEditingMaintenanceEntry(null);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
      >
        {showMaintenanceForm ? 'Hide Form' : 'Add New Maintenance Record'}
      </button>

      {showMaintenanceForm && (
        <MaintenanceForm
          onSave={handleAddOrUpdateMaintenance}
          onCancel={() => { setShowMaintenanceForm(false); setEditingMaintenanceEntry(null); }}
          initialData={editingMaintenanceEntry}
        />
      )}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-inner">
          <thead>
            <tr className="bg-gray-600 text-gray-200 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left rounded-tl-lg">Item</th>
              <th className="py-3 px-6 text-left">Last Service</th>
              <th className="py-3 px-6 text-left">Next Due</th>
              <th className="py-3 px-6 text-left">Notes</th>
              <th className="py-3 px-6 text-center rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-light">
            {maintenanceList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-400">
                  No maintenance records found. Add one to get started!
                </td>
              </tr>
            ) : (
              maintenanceList.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-600 hover:bg-gray-650">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{entry.item}</td>
                  <td className="py-3 px-6 text-left">{entry.lastService}</td>
                  <td className="py-3 px-6 text-left"><span className="text-yellow-400">{entry.nextDue}</span></td>
                  <td className="py-3 px-6 text-left">{entry.notes}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditClick(entry)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-md text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDeleteMaintenance(entry)}
                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showConfirmModal && entryToDelete && (
        <ConfirmationModal
          message={`Are you sure you want to delete the maintenance record for "${entryToDelete.item}"?`}
          onConfirm={executeDeleteMaintenance}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}

// --- Equipment Form Component ---
function EquipmentForm({ onSave, onCancel, initialData }) {
  const { showMessage } = useContext(FirebaseContext);
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [status, setStatus] = useState(initialData?.status || 'Operational'); // Default to operational for new items
  const [acquisitionDate, setAcquisitionDate] = useState(initialData?.acquisitionDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Define comprehensive categories for all workshop needs
  const categories = [
    'Power Supply', 'Measurement Tool', 'Signal Generator', 'Soldering', 'Prototyping',
    'General Hand Tool', 'Fastening & Driving Tool', 'Cutting & Measuring Tool',
    'Tape & Adhesive', 'Safety Gear', 'Lighting/Optics',
    'Consumable (General)', 'Non-Consumable (General)',
    'Metal Work Tool', 'Welding Tool', 'Painting/Finishing Tool', 'Air Tool',
    'General Mechanic/Fabricator/Home Specialist', 'Salvaged Component', 'Other'
  ].sort(); // Sort alphabetically for better UX

  const statuses = ['Needed', 'In Progress', 'Operational', 'Repair', 'Discarded'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('Item Name is required.', 'error');
      return;
    }
    if (!category.trim()) {
      showMessage('Category is required.', 'error');
      return;
    }
    if (!status.trim()) {
      showMessage('Status is required.', 'error');
      return;
    }

    // Basic date validation: ensure it's a valid date format if provided
    if (acquisitionDate && isNaN(new Date(acquisitionDate).getTime())) {
      showMessage('Invalid Acquisition Date format.', 'error');
      return;
    }

    onSave({ name, category, status, acquisitionDate, notes });
  };

  return (
    <div className="bg-gray-700 p-6 rounded-xl shadow-inner mb-6 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
      <h3 className="text-2xl font-semibold text-blue-200 mb-4">
        {initialData ? 'Edit Equipment' : 'Add New Equipment'}
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Item Name</label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-gray-300 text-sm font-bold mb-2">Category</label>
          <select
            id="category"
            className="shadow border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-gray-300 text-sm font-bold mb-2">Status</label>
          <select
            id="status"
            className="shadow border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            {statuses.map((stat) => (
              <option key={stat} value={stat}>{stat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="acquisitionDate" className="block text-gray-300 text-sm font-bold mb-2">Acquisition Date</label>
          <input
            type="date"
            id="acquisitionDate"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-gray-300 text-sm font-bold mb-2">Notes</label>
          <textarea
            id="notes"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
        <div className="md:col-span-2 flex justify-end space-x-3">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            {initialData ? 'Update Equipment' : 'Add Equipment'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Project Form Component (New!) ---
function ProjectForm({ onSave, onCancel, initialData }) {
  const { showMessage } = useContext(FirebaseContext);
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState(initialData?.status || 'Planning');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [requiredTools, setRequiredTools] = useState(initialData?.requiredTools || '');
  const [hardware, setHardware] = useState(initialData?.hardware || '');
  const [blockers, setBlockers] = useState(initialData?.blockers || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const projectStatuses = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Canceled'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('Project Name is required.', 'error');
      return;
    }
    if (!status.trim()) {
      showMessage('Status is required.', 'error');
      return;
    }
    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      showMessage('Invalid Due Date format.', 'error');
      return;
    }

    onSave({ name, status, dueDate, requiredTools, hardware, blockers, notes });
  };

  return (
    <div className="bg-gray-700 p-6 rounded-xl shadow-inner mb-6 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
      <h3 className="text-2xl font-semibold text-purple-200 mb-4">
        {initialData ? 'Edit Project' : 'Add New Project'}
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="projectName" className="block text-gray-300 text-sm font-bold mb-2">Project Name</label>
          <input
            type="text"
            id="projectName"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="projectStatus" className="block text-gray-300 text-sm font-bold mb-2">Status</label>
          <select
            id="projectStatus"
            className="shadow border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            {projectStatuses.map((stat) => (
              <option key={stat} value={stat}>{stat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="projectDueDate" className="block text-gray-300 text-sm font-bold mb-2">Due Date (Optional)</label>
          <input
            type="date"
            id="projectDueDate"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="requiredTools" className="block text-gray-300 text-sm font-bold mb-2">Required Tools (comma-separated)</label>
          <input
            type="text"
            id="requiredTools"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            value={requiredTools}
            onChange={(e) => setRequiredTools(e.target.value)}
            placeholder="e.g., Multimeter, Soldering Iron, Screwdriver Set"
          />
        </div>
        <div>
          <label htmlFor="hardware" className="block text-gray-300 text-sm font-bold mb-2">Required Hardware (comma-separated)</label>
          <input
            type="text"
            id="hardware"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            value={hardware}
            onChange={(e) => setHardware(e.target.value)}
            placeholder="e.g., ESP32, 5V Regulator, Breadboard"
          />
        </div>
        <div>
          <label htmlFor="blockers" className="block text-gray-300 text-sm font-bold mb-2">Blockers (if any)</label>
          <input
            type="text"
            id="blockers"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500"
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="e.g., Waiting for component delivery, Design review needed"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="projectNotes" className="block text-gray-300 text-sm font-bold mb-2">Notes</label>
          <textarea
            id="projectNotes"
            className="shadow appearance-none border border-gray-600 rounded-md w-full py-2 px-3 bg-gray-800 text-gray-200 leading-tight focus:outline-none focus:shadow-outline focus:border-purple-500 h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
        <div className="md:col-span-2 flex justify-end space-x-3">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            {initialData ? 'Update Project' : 'Add Project'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Projects Section Component (New!) ---
function ProjectsSection({ projectsList, showAddForm, setShowAddForm, editingProject, handleAddOrUpdateProject, handleDeleteProject, handleEditClick, setEditingProject }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const confirmDelete = (project) => {
    setProjectToDelete(project);
    setShowConfirmModal(true);
  };

  const executeDelete = () => {
    if (projectToDelete) {
      handleDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition duration-300 hover:shadow-purple-500/50">
      <h2 className="text-3xl font-semibold text-purple-300 mb-4 pb-2 border-b border-gray-700">
        Project Status & Management
      </h2>
      <button
        onClick={() => {
          setShowAddForm(!showAddForm);
          setEditingProject(null);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
      >
        {showAddForm ? 'Hide Form' : 'Add New Project'}
      </button>

      {showAddForm && (
        <ProjectForm
          onSave={handleAddOrUpdateProject}
          onCancel={() => { setShowAddForm(false); setEditingProject(null); }}
          initialData={editingProject}
        />
      )}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-inner">
          <thead>
            <tr className="bg-gray-600 text-gray-200 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left rounded-tl-lg">Project Name</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Due Date</th>
              <th className="py-3 px-6 text-left">Blockers</th>
              <th className="py-3 px-6 text-center rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 text-sm font-light">
            {projectsList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-400">
                  No projects added yet. Add one to get started!
                </td>
              </tr>
            ) : (
              projectsList.map((project) => (
                <tr key={project.id} className="border-b border-gray-600 hover:bg-gray-650">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{project.name}</td>
                  <td className="py-3 px-6 text-left">{project.status}</td>
                  <td className="py-3 px-6 text-left">{project.dueDate || 'N/A'}</td>
                  <td className="py-3 px-6 text-left">{project.blockers || 'None'}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditClick(project)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded-md text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(project)}
                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showConfirmModal && projectToDelete && (
        <ConfirmationModal
          message={`Are you sure you want to delete project "${projectToDelete.name}"? This action cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}


// --- Main App Component ---
function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [projectsList, setProjectsList] = useState([]); // New state for projects
  const [showAddForm, setShowAddForm] = useState(false); // For Equipment Form
  const [showAddProjectForm, setShowAddProjectForm] = useState(false); // For Project Form
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingProject, setEditingProject] = useState(null); // New state for editing project
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'inventory', 'ai', 'maintenance', 'projects'

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  // useCallback for showMessage to prevent unnecessary re-renders of children
  const showNotification = useCallback((msg, type) => {
    setMessage(msg);
    setMessageType(type);
    const timer = setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000); // Notification disappears after 5 seconds
    return () => clearTimeout(timer); // Cleanup on component unmount or new message
  }, []); // Empty dependency array means it's created once

  // Initialize Firebase and handle authentication
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authentication = getAuth(app);

      setDb(firestore);
      setAuth(authentication);

      const unsubscribe = onAuthStateChanged(authentication, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
          console.log("Firebase Auth State Changed: User logged in", user.uid);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(authentication, initialAuthToken);
              // userId will be set by the next onAuthStateChanged call
            } else {
              const anonUser = await signInAnonymously(authentication);
              setUserId(anonUser.user.uid);
              setIsAuthReady(true);
              console.log("Firebase Auth State Changed: Signed in anonymously", anonUser.user.uid);
            }
          } catch (error) {
            console.error("Firebase authentication error:", error);
            showNotification(`Authentication error: ${error.message}`, 'error');
            setIsAuthReady(true); // Still set to true to unblock UI, even if auth failed
          }
        }
      });

      return () => unsubscribe(); // Cleanup auth listener
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      showNotification(`Firebase initialization error: ${error.message}`, 'error');
      setIsAuthReady(true);
    }
  }, [initialAuthToken, showNotification]);

  // Fetch equipment data using onSnapshot and pre-populate if empty
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const equipmentCollectionRef = collection(db, `artifacts/${appId}/public/data/equipment`);
      console.log(`Attempting to listen to: artifacts/${appId}/public/data/equipment`);

      const unsubscribe = onSnapshot(equipmentCollectionRef, async (snapshot) => {
        if (snapshot.empty) {
          console.log("Equipment collection is empty, pre-populating with default data.");
          const defaultEquipment = [
            { name: 'Fluke 117 Digital Multimeter', category: 'Measurement Tool', status: 'Operational', acquisitionDate: '2024-01-15', notes: 'Essential for basic electrical measurements.' },
            { name: 'Weller WES51 Soldering Station', category: 'Soldering', status: 'Operational', acquisitionDate: '2024-05-01', notes: 'Temperature-controlled for precise soldering.' },
            { name: 'DIY Laptop Oscilloscope (ESP32)', category: 'Measurement Tool', status: 'In Progress', acquisitionDate: '2025-06-22', notes: 'Building Analog Front-End for signal visualization.' },
            { name: 'MIG Welder (120V)', category: 'Welding Tool', status: 'Operational', acquisitionDate: '2025-03-15', notes: 'Capable of flux core and MIG welding for fabrication.' },
            { name: 'Metric Socket Set (1/2" Drive)', category: 'Fastening & Driving Tool', status: 'Operational', acquisitionDate: '2024-09-01', notes: 'Comprehensive set for various mechanical tasks.' },
            { name: 'Shop Rags (Bulk Pack)', category: 'Consumable (General)', status: 'Operational', acquisitionDate: '2025-06-01', notes: '50-count pack for general cleaning and spills.' },
            { name: 'Safety Glasses (Clear)', category: 'Safety Gear', status: 'Operational', acquisitionDate: '2024-02-10', notes: 'ANSI Z87.1 certified for eye protection.' },
            { name: 'Bench Vice (6-inch)', category: 'Metal Work Tool', status: 'Operational', acquisitionDate: '2024-11-01', notes: 'Heavy-duty with swivel base for secure workholding.' },
            { name: 'Old Laptop PSU (Salvaged)', category: 'Salvaged Component', status: 'Operational', acquisitionDate: '2025-05-20', notes: 'Provides 19V DC. Useful for prototyping power supply projects.' },
            { name: 'Wire Strippers (Multi-gauge)', category: 'General Hand Tool', status: 'Operational', acquisitionDate: '2024-03-01', notes: 'Auto-stripping feature for various wire sizes.' },
            { name: 'Duct Tape (Silver)', category: 'Tape & Adhesive', status: 'Operational', acquisitionDate: '2024-07-05', notes: 'Heavy-duty general-purpose tape.' },
            { name: 'Air Compressor (20 Gallon)', category: 'Air Tool', status: 'Operational', acquisitionDate: '2025-01-20', notes: 'Powers air tools and painting equipment.' },
            { name: 'ESD Mat & Wrist Strap', category: 'Safety Gear', status: 'Operational', acquisitionDate: '2024-02-10', notes: 'Protects sensitive electronics from static discharge.' },
            { name: 'Hex Key Set (Metric & SAE)', category: 'Fastening & Driving Tool', status: 'Operational', acquisitionDate: '2024-10-10', notes: 'Fold-out style for easy access.' },
          ];
          const existingDocs = await getDocs(equipmentCollectionRef);
          if (existingDocs.empty) {
             for (const item of defaultEquipment) {
                await addDoc(equipmentCollectionRef, item);
            }
          }
        }

        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => {
          if (a.acquisitionDate && b.acquisitionDate) {
            return new Date(b.acquisitionDate) - new Date(a.acquisitionDate);
          }
          return (a.name || '').localeCompare(b.name || '');
        });
        setEquipmentList(items);
        console.log("Equipment data fetched:", items);
      }, (error) => {
        console.error("Error fetching equipment data:", error);
        showNotification(`Error loading equipment: ${error.message}`, 'error');
      });

      return () => unsubscribe();
    } else if (isAuthReady && !userId) {
        showNotification('User ID not available after authentication. Cannot load data.', 'error');
    }
  }, [db, userId, appId, isAuthReady, showNotification]);

  // Fetch projects data using onSnapshot and pre-populate if empty
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const projectsCollectionRef = collection(db, `artifacts/${appId}/public/data/projects`);
      console.log(`Attempting to listen to: artifacts/${appId}/public/data/projects`);

      const unsubscribe = onSnapshot(projectsCollectionRef, async (snapshot) => {
        if (snapshot.empty) {
          console.log("Projects collection is empty, pre-populating with default data.");
          const defaultProjects = [
            { name: 'DIY Laptop Oscilloscope Build', status: 'In Progress', dueDate: '2025-07-30', requiredTools: 'Soldering Iron, Multimeter, Breadboard', hardware: 'ESP32, Op-Amps, Resistors', blockers: 'Waiting for custom PCB fabrication', notes: 'Primary project for test bench enhancement.' },
            { name: 'Smart Power Strip Integration', status: 'Planning', dueDate: '2025-08-15', requiredTools: 'Screwdriver Set, Wire Strippers', hardware: 'ESP8266, Relays, Current Sensors', blockers: 'Component sourcing pending', notes: 'Automate power for specific test bench areas.' },
            { name: 'Welding Cart Fabrication', status: 'Completed', dueDate: '2025-05-20', requiredTools: 'MIG Welder, Angle Grinder, Clamps', hardware: 'Steel Square Tubing, Casters', blockers: 'None', notes: 'Improved workshop organization.' },
          ];
          const existingDocs = await getDocs(projectsCollectionRef);
          if (existingDocs.empty) {
            for (const project of defaultProjects) {
              await addDoc(projectsCollectionRef, project);
            }
          }
        }

        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        projects.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          return (a.name || '').localeCompare(b.name || '');
        });
        setProjectsList(projects);
        console.log("Projects data fetched:", projects);
      }, (error) => {
        console.error("Error fetching projects data:", error);
        showNotification(`Error loading projects: ${error.message}`, 'error');
      });

      return () => unsubscribe();
    } else if (isAuthReady && !userId) {
      showNotification('User ID not available after authentication. Cannot load project data.', 'error');
    }
  }, [db, userId, appId, isAuthReady, showNotification]);


  const handleAddOrUpdateEquipment = async (equipmentData) => {
    if (!db || !userId) {
      showNotification('Database not ready or user not authenticated.', 'error');
      return;
    }
    const equipmentCollectionRef = collection(db, `artifacts/${appId}/public/data/equipment`);
    try {
      if (editingEquipment) {
        await updateDoc(doc(equipmentCollectionRef, editingEquipment.id), equipmentData);
        showNotification('Equipment updated successfully!', 'success');
      } else {
        await addDoc(equipmentCollectionRef, equipmentData);
        showNotification('Equipment added successfully!', 'success');
      }
      setShowAddForm(false);
      setEditingEquipment(null);
    } catch (e) {
      console.error("Error adding/updating document: ", e);
      showNotification(`Error saving equipment: ${e.message}`, 'error');
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (!db || !userId) {
      showNotification('Database not ready or user not authenticated.', 'error');
      return;
    }
    const equipmentDocRef = doc(db, `artifacts/${appId}/public/data/equipment`, id);
    try {
      await deleteDoc(equipmentDocRef);
      showNotification('Equipment deleted successfully!', 'success');
    } catch (e) {
      console.error("Error deleting document: ", e);
      showNotification(`Error deleting equipment: ${e.message}`, 'error');
    }
  };

  const handleEditEquipmentClick = (equipment) => {
    setEditingEquipment(equipment);
    setShowAddForm(true);
    setActiveSection('inventory'); // Switch to inventory section when editing
  };

  const handleAddOrUpdateProject = async (projectData) => {
    if (!db || !userId) {
      showNotification('Database not ready or user not authenticated.', 'error');
      return;
    }
    const projectsCollectionRef = collection(db, `artifacts/${appId}/public/data/projects`);
    try {
      if (editingProject) {
        await updateDoc(doc(projectsCollectionRef, editingProject.id), projectData);
        showNotification('Project updated successfully!', 'success');
      } else {
        await addDoc(projectsCollectionRef, projectData);
        showNotification('Project added successfully!', 'success');
      }
      setShowAddProjectForm(false);
      setEditingProject(null);
    } catch (e) {
      console.error("Error adding/updating project: ", e);
      showNotification(`Error saving project: ${e.message}`, 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!db || !userId) {
      showNotification('Database not ready or user not authenticated.', 'error');
      return;
    }
    const projectDocRef = doc(db, `artifacts/${appId}/public/data/projects`, id);
    try {
      await deleteDoc(projectDocRef);
      showNotification('Project deleted successfully!', 'success');
    } catch (e) {
      console.error("Error deleting project: ", e);
      showNotification(`Error deleting project: ${e.message}`, 'error');
    }
  };

  const handleEditProjectClick = (project) => {
    setEditingProject(project);
    setShowAddProjectForm(true);
    setActiveSection('projects'); // Switch to projects section when editing
  };

  // Loading state
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
        <p className="ml-4 text-lg">Loading Test Bench Dashboard...</p>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, appId, showMessage: showNotification }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 font-inter p-4 sm:p-6">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-400 drop-shadow-lg">
            Electronic Test Bench Management
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl mt-2">
            Your centralized hub for workshop health, inventory, and AI integration.
          </p>
          {userId && (
            <p className="text-sm text-gray-500 mt-2">
              User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-orange-300">{userId}</span>
            </p>
          )}
        </header>

        {/* Notification Component */}
        <Notification message={message} type={messageType} onClose={() => setMessage('')} />

        {/* Navigation Tabs */}
        <nav className="mb-8 bg-gray-800 p-2 rounded-xl shadow-lg flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setActiveSection('overview')}
            className={`py-2 px-5 rounded-lg text-lg font-medium transition duration-300 ${activeSection === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Shop Overview
          </button>
          <button
            onClick={() => setActiveSection('inventory')}
            className={`py-2 px-5 rounded-lg text-lg font-medium transition duration-300 ${activeSection === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Equipment Inventory
          </button>
          <button
            onClick={() => setActiveSection('projects')}
            className={`py-2 px-5 rounded-lg text-lg font-medium transition duration-300 ${activeSection === 'projects' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveSection('ai')}
            className={`py-2 px-5 rounded-lg text-lg font-medium transition duration-300 ${activeSection === 'ai' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            AI Integration
          </button>
          <button
            onClick={() => setActiveSection('maintenance')}
            className={`py-2 px-5 rounded-lg text-lg font-medium transition duration-300 ${activeSection === 'maintenance' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Maintenance Log
          </button>
        </nav>

        {/* Content Sections */}
        <div className="content-area">
          {activeSection === 'overview' && <ShopOverviewSection equipmentList={equipmentList} projectsList={projectsList} setActiveSection={setActiveSection} />}
          {activeSection === 'inventory' && (
            <EquipmentInventorySection
              equipmentList={equipmentList}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              editingEquipment={editingEquipment}
              handleAddOrUpdateEquipment={handleAddOrUpdateEquipment}
              handleDeleteEquipment={handleDeleteEquipment}
              handleEditClick={handleEditEquipmentClick}
              setEditingEquipment={setEditingEquipment}
            />
          )}
          {activeSection === 'projects' && (
            <ProjectsSection
              projectsList={projectsList}
              showAddForm={showAddProjectForm}
              setShowAddForm={setShowAddProjectForm}
              editingProject={editingProject}
              handleAddOrUpdateProject={handleAddOrUpdateProject}
              handleDeleteProject={handleDeleteProject}
              handleEditClick={handleEditProjectClick}
              setEditingProject={setEditingProject}
            />
          )}
          {activeSection === 'ai' && <AIIntegrationSection />}
          {activeSection === 'maintenance' && <MaintenanceLogSection />}
        </div>
      </div>
    </FirebaseContext.Provider>
  );
}

// Ensure Tailwind CSS is loaded
const tailwindScript = document.createElement('script');
tailwindScript.src = 'https://cdn.tailwindcss.com';
document.head.appendChild(tailwindScript);

// Apply custom font Inter (or similar sans-serif)
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const style = document.createElement('style');
style.innerHTML = `
  body {
    font-family: 'Inter', sans-serif;
  }
  /* Custom scrollbar for better aesthetics, especially for tables */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #2d3748; /* gray-800 */
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: #4a5568; /* gray-600 */
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #6a768f; /* a lighter gray */
  }
`;
document.head.appendChild(style);


export default App;
