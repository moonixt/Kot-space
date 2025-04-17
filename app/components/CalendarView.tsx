import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Plus, X, Edit2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

// Opções de cores para os eventos
const eventColors = [
    { name: "Indigo", value: "bg-indigo-500", text: "text-white" },
    { name: "Rose", value: "bg-rose-500", text: "text-white" },
    { name: "Emerald", value: "bg-emerald-500", text: "text-white" },
    { name: "Violet", value: "bg-violet-500", text: "text-white" },
    { name: "Amber", value: "bg-amber-400", text: "text-black" },
    { name: "Cyan", value: "bg-cyan-500", text: "text-white" },
    { name: "Teal", value: "bg-teal-500", text: "text-white" },
    { name: "Sky", value: "bg-sky-500", text: "text-white" },
];

const daysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Função para formatar datas com zero à esquerda (01, 02, etc.)
const formatDate = (year: number, month: number, day: number): string => {
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${formattedMonth}-${formattedDay}`;
};

interface Event {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  color?: string; // Nova propriedade para cor
  description?: string; // Campo de descrição adicionado
}

// Modal for event details and editing
const EventModal = ({ event, onClose, onSave, onDelete, colors }) => {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [color, setColor] = useState(event?.color || colors[0].value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-[var(--background)] p-6 rounded shadow-lg w-full max-w-md relative">
        <button className="absolute top-2 right-2" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <h3 className="font-bold mb-2">Edit Event</h3>
        <input
          className="w-full border mb-2 p-2 rounded"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          className="w-full border mb-2 p-2 rounded"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
        />
        <div className="flex gap-2 mb-2">
          {colors.map(c => (
            <button
              key={c.value}
              className={`w-6 h-6 rounded-full ${c.value} ${color === c.value ? 'ring-2 ring-blue-400' : ''}`}
              onClick={() => setColor(c.value)}
              aria-label={c.name}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => onSave({ ...event, title, description, color })}
          >Save</button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => onDelete(event.id)}
          >Delete</button>
        </div>
      </div>
    </div>
  );
};

const CalendarView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState("");
  const [newDescription, setNewDescription] = useState(""); // Estado para descrição do evento
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [highlightToday, setHighlightToday] = useState(true);
  const [, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(eventColors[0].value);
  const [modalEvent, setModalEvent] = useState(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const days = daysInMonth(month, year);
  const today = new Date();

  // Load events from Supabase on mount and when month/year changes
  useEffect(() => {
    if (user) {
      console.log("Carregando eventos do Supabase para:", { year, month: month + 1 });
      fetchEvents();
    }
  }, [user, year, month]);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = formatDate(year, month + 1, 1);
      const endDate = formatDate(year, month + 1, days);
      
      console.log("Buscando eventos entre:", startDate, "e", endDate);
      
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) {
        console.error("Erro ao buscar eventos:", error);
      } else if (data) {
        console.log("Eventos recuperados com sucesso:", data.length, "eventos");
        setEvents(data);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
    setSelectedDay(today.getDate());
  };

  const addEvent = async () => {
    console.log("Função addEvent chamada");
    if (!newEvent.trim() || selectedDay === null || !user) {
      console.log("Validação falhou:", {
        newEvent: newEvent.trim() ? "válido" : "inválido",
        selectedDay: selectedDay,
        user: user ? "válido" : "inválido"
      });
      return;
    }
    
    const eventDate = formatDate(year, month + 1, selectedDay);
    console.log("Criando novo evento:", { 
      title: newEvent, 
      date: eventDate, 
      color: selectedColor,
      description: newDescription 
    });
    
    const newEventObj: Event = {
      id: Date.now().toString(),
      title: newEvent,
      date: eventDate,
      completed: false,
      color: selectedColor,
      description: newDescription.trim() || undefined // Adicionar descrição se existir
    };
    
    try {
      console.log("Tentando salvar no Supabase");
      // Save to Supabase
      const { data, error } = await supabase.from("calendar_events").insert({
        id: newEventObj.id,
        title: newEventObj.title,
        date: newEventObj.date,
        completed: newEventObj.completed,
        color: selectedColor,
        description: newDescription.trim() || null, // Salvar descrição no banco
        user_id: user.id
      }).select();
      
      if (error) {
        console.error("Erro ao adicionar evento no Supabase:", error);
        alert(`Erro ao salvar evento: ${error.message}`);
        return;
      }
      
      console.log("Evento salvo com sucesso no Supabase:", data);
      
      // Update local state
      setEvents([...events, newEventObj]);
      setNewEvent("");
      setNewDescription(""); // Limpar a descrição após salvar
      
    } catch (err) {
      console.error("Erro inesperado ao adicionar evento:", err);
      alert("Ocorreu um erro ao salvar o evento. Por favor, tente novamente.");
    }
  };

  const toggleEventCompletion = async (eventId: string) => {
    try {
      // Find the event
      const eventToToggle = events.find(event => event.id === eventId);
      if (!eventToToggle) return;
      
      const updatedCompleted = !eventToToggle.completed;
      
      // Update in Supabase
      const { error } = await supabase
        .from("calendar_events")
        .update({ completed: updatedCompleted })
        .eq("id", eventId)
        .eq("user_id", user?.id);
        
      if (error) {
        console.error("Error updating event:", error);
        return;
      }
      
      // Update local state
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, completed: updatedCompleted } : event
      ));
    } catch (err) {
      console.error("Unexpected error toggling event completion:", err);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user?.id);
        
      if (error) {
        console.error("Error deleting event:", error);
        return;
      }
      
      // Update local state
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      console.error("Unexpected error deleting event:", err);
    }
  };

  const handleEventSave = async (updatedEvent) => {
    try {
      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: updatedEvent.title,
          description: updatedEvent.description,
          color: updatedEvent.color
        })
        .eq("id", updatedEvent.id)
        .eq("user_id", user?.id);
      if (error) throw error;
      setEvents(events.map(ev => ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev));
      setModalEvent(null);
    } catch (err) {
      alert("Error updating event");
    }
  };

  const getEventsForDay = (day: number) => {
    const formattedDate = formatDate(year, month + 1, day);
    return events.filter(event => event.date === formattedDate);
  };

  // Check if a specific day is today
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if a specific day has any events
  const hasEvents = (day: number) => {
    return getEventsForDay(day).length > 0;
  };

  // Array of day names translated
  const dayNames = [
    t('calendar.sun'), 
    t('calendar.mon'), 
    t('calendar.tue'), 
    t('calendar.wed'), 
    t('calendar.thu'), 
    t('calendar.fri'), 
    t('calendar.sat')
  ];

  return (
    <div className=" bg-[var(--background)] ">
      {/* Header with month and year navigation */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded hover:bg-[var(--container)] transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded hover:bg-[var(--container)] transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <h2 className="font-semibold text-lg">
          {selectedDate.toLocaleString(i18n.language, { month: "long" })} {year}
        </h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleTodayClick}
            className="flex items-center gap-1 text-sm px-3 py-1 border border-[var(--border-color)] rounded hover:bg-[var(--container)] transition-colors"
          >
            <CalendarIcon size={16} />
            <span>{t('calendar.today')}</span>
          </button>
          <button
            onClick={() => setHighlightToday(!highlightToday)}
            className={`text-sm px-3 py-1 border rounded transition-colors ${
              highlightToday 
                ? 'bg-[var(--foreground)] text-[var(--background)]' 
                : 'border-[var(--border-color)] hover:bg-[var(--container)]'
            }`}
          >
            {t('calendar.highlightToday')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 ">
        {/* Render day headers */}
        {dayNames.map((day) => (
          <div key={day} className="text-center font-bold text-[var(--foreground)] py-2">
            {day}
          </div>
        ))}

        {/* Render empty cells for days before the first day of the month */}
        {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, index) => (
          <div key={`empty-${index}`} className=" bg-[var(--container)] bg-opacity-30 rounded"></div>
        ))}

        {/* Render days of the month */}
        {Array.from({ length: days }).map((_, day) => {
          const dayNum = day + 1;
          const dayEvents = getEventsForDay(dayNum);
          const showEvents = dayEvents.slice(0, 2);
          const extraCount = dayEvents.length - 2;
          
          return (
            <div
              key={dayNum}
              tabIndex={0}
              aria-label={`Day ${dayNum}${isToday(dayNum) ? ', today' : ''}`}
              className={`h-20 flex flex-col border-t border-b border-[var(--foreground)]	
                ${selectedDay === dayNum ? 'ring-2 ring-blue-400' : ''}
                ${(isToday(dayNum) && highlightToday) ? ' dark:bg-opacity-20' : 'bg-[var(--container)] bg-opacity-50'}
                ${hasEvents(dayNum) ? 'border-blue-200 dark:border-blue-800' : 'border-[var(--border-color)]'}
                hover:shadow-md transition cursor-pointer`}
              onClick={() => setSelectedDay(dayNum)}
              onKeyDown={e => { if (e.key === 'Enter') setSelectedDay(dayNum); }}
            >
              <div className={`text-left font-medium rounded-full w-7 h-7 flex items-center justify-center
                ${(isToday(dayNum) && highlightToday) ? 'bg-red-600 text-white' : 'text-[var(--foreground)]'}`}>
                {dayNum}
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin mt-1">
                {showEvents.map(event => (
                  <button
                    key={event.id}
                    className={`w-full text-left px-1 py-0.5 rounded flex items-center text-2xs
                      ${event.completed ? 'line-through opacity-50' : ''}
                      ${event.color || 'bg-blue-400 text-white'}`}
                    onClick={e => { e.stopPropagation(); setModalEvent(event); }}
                    aria-label={`Event: ${event.title}`}
                  >
                    <span className="truncate flex-1 sm:text-[11px] text-[5px] text-white">{event.title}</span>
                    <Edit2 size={12} className="ml-1" />
                  </button>
                ))}
                {extraCount > 0 && (
                  <div className="text-[9px] text-gray-500 px-1">+{extraCount} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event management panel */}
      {selectedDay && (
        <div className="p-4  bg-[var(--container)] bg-opacity-50 flex flex-col ">
          <h3 className="font-medium text-[var(--foreground)] text-center">
            {selectedDate.toLocaleString(i18n.language, { month: "long" })} {selectedDay}, {year}
          </h3>
          
          <div className="flex flex-col md:flex-row ">
            {/* Add new event */}
            <div className="flex flex-col flex-1">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">{t('calendar.addEvent')}</h4>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder={t('calendar.eventTitle')}
                  className="w-full border border-[var(--border-color)] px-3 py-2 bg-transparent text-[var(--foreground)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addEvent();
                    }
                  }}
                />
                
                {/* Campo de descrição do evento */}
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t('calendar.eventDescription')}
                  className="w-full border border-[var(--border-color)] px-3 py-2 bg-transparent text-[var(--foreground)] resize-none h-20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      addEvent();
                    }
                  }}
                />
                
                <div className="flex mt-2 items-center gap-2">
                  <div className="flex space-x-1">
                    {eventColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-6 h-6 rounded-full ${color.value} ${
                          selectedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Botão Adicionar clicado, chamando addEvent()");
                      addEvent();
                    }}
                    className="px-3 py-2 bg-[var(--foreground)] text-[var(--background)] hover:bg-opacity-80 transition-colors ml-auto"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Events list */}
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">{t('calendar.events')}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin border border-[var(--border-color)] p-2 rounded">
                {getEventsForDay(selectedDay).length > 0 ? (
                  getEventsForDay(selectedDay).map(event => (
                    <div key={event.id} className={`flex flex-col p-2 border border-[var(--border-color)] rounded group ${event.color ? event.color + ' bg-opacity-75' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <button
                            onClick={() => toggleEventCompletion(event.id)}
                            className={`rounded-full p-1 flex-shrink-0
                              ${event.completed ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:bg-opacity-50 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}
                          >
                            <Check size={14} />
                          </button>
                          <span className={`truncate font-medium ${event.completed ? 'line-through opacity-60' : ''} ${event.color && event.color.includes('text-white') ? 'text-white' : 'text-[var(--foreground)]'}`}>
                            {event.title}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-500 bg-white bg-opacity-75 rounded-full p-1 ml-2"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      {/* Exibir a descrição se existir */}
                      {event.description && (
                        <div className={`mt-1 text-xs ${event.completed ? 'line-through opacity-60' : ''} ${event.color && event.color.includes('text-white') ? 'text-white' : 'text-[var(--foreground)]'}`}>
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground)] opacity-60 text-center py-2">
                    {t('calendar.noEvents')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {modalEvent && (
        <EventModal
          event={modalEvent}
          onClose={() => setModalEvent(null)}
          onSave={handleEventSave}
          onDelete={deleteEvent}
          colors={eventColors}
        />
      )}
    </div>
  );
};

export default CalendarView;