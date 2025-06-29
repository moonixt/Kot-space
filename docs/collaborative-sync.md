# Sistema de Sincronização Colaborativa

Este documento descreve o sistema otimizado de sincronização em tempo real para notas colaborativas implementado no FairNote.

## Visão Geral

O sistema implementa uma solução de polling otimizado que verifica atualizações na nota colaborativa a cada 2 segundos quando a nota está aberta e sendo visualizada.

## Componentes

### 1. Hook `useCollaborativeNoteSync`

**Localização:** `hooks/useCollaborativeNoteSync.ts`

**Funcionalidades:**
- Polling automático a cada 2 segundos para notas públicas
- Detecção de status online/offline
- Sistema de detecção de conflitos
- Caching inteligente (só atualiza se houve mudanças)
- Tratamento de erros

**Parâmetros:**
```typescript
interface UseCollaborativeNoteSyncProps {
  noteId: string | null;
  noteType: 'private' | 'public';
  user: any;
  isEnabled: boolean; // Só sincroniza quando habilitado
}
```

**Retorno:**
```typescript
interface SyncResult {
  note: Note | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOnline: boolean;
  hasConflict: boolean;
  conflictNote: Note | null;
  refreshNote: () => Promise<void>;
  markUserEditStart: () => void;
  resolveConflict: (useServerVersion: boolean) => void;
}
```

### 2. Integração na Página de Notas

**Localização:** `app/notes/[id]/page.tsx`

**Implementação:**
- Hook ativado apenas para notas públicas
- Polling pausado durante modo de edição para evitar conflitos
- Indicadores visuais de status de sincronização
- Banner de resolução de conflitos

## Funcionamento

### 1. Sincronização Automática

- **Intervalo:** 2 segundos
- **Condições:** Apenas para notas públicas, quando não está em modo de edição
- **Otimização:** Verifica `updated_at` para evitar atualizações desnecessárias

### 2. Detecção de Conflitos

O sistema detecta conflitos quando:
1. Usuário está editando a nota (modo de edição ativo)
2. Servidor retorna uma versão mais recente que o início da edição
3. Existem edições locais não salvas

### 3. Resolução de Conflitos

Quando um conflito é detectado:
1. Banner de aviso é exibido
2. Usuário pode escolher:
   - **Usar versão do servidor:** Descarta mudanças locais
   - **Manter versão local:** Ignora mudanças do servidor

### 4. Indicadores Visuais

**Durante edição:**
- Status de conexão (online/offline)
- Última sincronização
- Avisos de erro

**Na área de informações:**
- Status completo da sincronização
- Timestamp da última sincronização
- Status de erro detalhado

## Otimizações

### 1. Performance
- Polling inteligente (apenas quando necessário)
- Cache de versões para evitar updates desnecessários
- Descriptografia apenas quando há mudanças

### 2. UX
- Não interrompe a edição do usuário
- Indicadores visuais claros
- Resolução de conflitos simples

### 3. Rede
- Detecção de status offline
- Pausa automática quando offline
- Retry automático quando volta online

## Casos de Uso

### 1. Visualização Colaborativa
```
Usuário A abre nota → Polling inicia → Usuário B edita → A vê mudanças automaticamente
```

### 2. Edição Simultânea
```
Usuário A edita → Usuário B edita → Sistema detecta conflito → Banner de resolução
```

### 3. Offline/Online
```
Usuário fica offline → Polling para → Volta online → Polling retoma automaticamente
```

## Configuração

### Intervalo de Polling
Atualmente configurado para 2 segundos. Pode ser ajustado alterando o valor em:
```typescript
intervalRef.current = setInterval(() => {
  fetchNoteUpdate();
}, 2000); // ← Alterar aqui
```

### Habilitação
O sistema é habilitado automaticamente para:
- Notas públicas (colaborativas)
- Usuário autenticado
- Nota carregada
- Fora do modo de edição

## Monitoramento

### Logs
O sistema produz logs úteis no console:
- `'Collaborative sync: Note updated from server'`
- `'Potential conflict detected'`

### Métricas
- Status de conexão
- Timestamp da última sincronização
- Contagem de erros

## Extensões Futuras

### Possíveis Melhorias
1. **WebSocket Real-time:** Substituir polling por WebSocket para latência menor
2. **Merge Automático:** Algoritmo de merge inteligente para conflitos
3. **Cursores Colaborativos:** Mostrar onde outros usuários estão editando
4. **Histórico de Versões:** Manter histórico de mudanças para recovery
5. **Presença de Usuários:** Mostrar quem está visualizando/editando

### Considerações Técnicas
- Balanceamento entre performance e real-time
- Gestão de conflitos mais sofisticada
- Suporte a edição de múltiplos usuários simultâneos
- Otimização de largura de banda
