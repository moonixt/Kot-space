// Event Emitter simples para comunicação entre componentes
type Listener = () => void;

class EventEmitter {
  private events: { [key: string]: Listener[] } = {};

  // Adicionar um listener para um evento
  on(event: string, listener: Listener): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  // Remover um listener
  off(event: string, listener: Listener): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  // Emitir um evento
  emit(event: string): void {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener());
  }
}

// Criar e exportar uma instância única do EventEmitter
const eventEmitter = new EventEmitter();
export default eventEmitter;