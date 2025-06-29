# Sistema de Sincronização Colaborativa do FairNote

## Visão Geral
O sistema de sincronização colaborativa permite que múltiplos usuários visualizem e editem notas públicas simultaneamente, com atualizações em tempo real e detecção de conflitos.

## Funcionalidades

### Sincronização em Tempo Real
- **Polling automático**: Verifica atualizações a cada 2-3 segundos
- **Modo de visualização**: Polling a cada 2 segundos
- **Modo de edição**: Polling a cada 3 segundos (ligeiramente mais lento para reduzir interrupções)
- **Funcionamento contínuo**: O polling agora funciona tanto no modo visualização quanto no modo edição

### Detecção de Conflitos
- **Detecção automática**: Identifica quando múltiplos usuários editam simultaneamente
- **Prevenção de sobrescrita**: Não atualiza automaticamente se há edições locais
- **Interface de resolução**: Permite ao usuário escolher entre manter suas alterações ou aceitar a versão do servidor
- **Controle inteligente**: Em modo de edição, todas as atualizações externas são tratadas como potenciais conflitos

### Controle de Estado
- **Status de sincronização**: Exibe se a nota está sincronizada
- **Indicador de conflitos**: Mostra quando há versões conflitantes
- **Status de conectividade**: Monitora se o usuário está online/offline

## Componentes Principais

### Hook `useCollaborativeNoteSync`

#### Props
```typescript
interface UseCollaborativeNoteSyncProps {
  noteId: string | null;
  noteType: 'private' | 'public';
  user: any;
  isEnabled: boolean;
  editMode?: boolean; // Controla o comportamento durante edição
}
```

#### Retorno
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

#### Comportamento por Modo

**Modo Visualização (editMode = false)**:
- Polling ativo a cada 2 segundos
- Atualizações automáticas da interface
- Detecção de conflitos baseada em edições locais salvas

**Modo Edição (editMode = true)**:
- Polling ativo a cada 3 segundos
- Todas as atualizações externas são tratadas como potenciais conflitos
- Requer decisão do usuário para aplicar mudanças
- Permite visualizar atualizações de outros colaboradores em tempo real

### Algoritmo de Detecção de Conflitos

1. **Timestamp de edição**: Registra quando o usuário inicia uma edição
2. **Verificação de versão**: Compara a última atualização do servidor com o timestamp local
3. **Edições locais**: Verifica se há dados salvos no localStorage
4. **Resolução**: Apresenta opções para o usuário quando detecta conflito

## Configuração e Uso

### Integração na Página de Nota

```typescript
const {
  note: syncedNote,
  loading: syncLoading,
  hasConflict,
  conflictNote,
  markUserEditStart,
  resolveConflict
} = useCollaborativeNoteSync({
  noteId: note?.id || null,
  noteType: note?.type || 'private',
  user,
  isEnabled: true,
  editMode: isEditing // Novo: controla comportamento durante edição
});
```

### Tratamento de Conflitos na Interface

```typescript
// Quando detectar conflito, mostrar opções ao usuário
if (hasConflict && conflictNote) {
  return (
    <ConflictResolutionDialog
      localVersion={note}
      serverVersion={conflictNote}
      onResolve={(useServerVersion) => {
        resolveConflict(useServerVersion);
        if (useServerVersion) {
          // Atualizar interface com versão do servidor
        }
      }}
    />
  );
}
```

## Melhorias Implementadas

### Versão 2.0 (Atual)
- ✅ **Polling contínuo**: Funciona tanto em modo visualização quanto edição
- ✅ **Intervalos otimizados**: 2s para visualização, 3s para edição
- ✅ **Detecção robusta de conflitos**: Especialmente sensível durante edição
- ✅ **Controle de concorrência**: Previne múltiplos fetches simultâneos
- ✅ **Logs detalhados**: Facilita debug e monitoramento
- ✅ **Interface de status**: Indicadores visuais de sincronização e conflitos

### Versão 1.0 (Corrigida)
- ✅ **Correção crítica**: Fixado intervalo de polling de 0ms para 2000ms
- ✅ **Controle de dependências**: Prevenção de loops infinitos
- ✅ **Validações rigorosas**: Verificações antes de cada fetch
- ✅ **Tratamento de erros**: Logs e recuperação de falhas

## Cenários de Uso

### 1. Edição Simultânea
- **Usuário A** está editando uma nota
- **Usuário B** também abre a mesma nota para edição
- Sistema detecta e alerta sobre atualizações de outros usuários
- Cada usuário pode decidir se quer aplicar as mudanças externas

### 2. Visualização com Atualizações
- **Usuário A** está visualizando uma nota
- **Usuário B** faz alterações
- Sistema atualiza automaticamente a visualização do Usuário A
- Transição suave sem perda de contexto

### 3. Recuperação de Conectividade
- Sistema detecta quando usuário fica offline
- Pausa sincronização automaticamente
- Retoma quando conectividade é restaurada
- Sincroniza mudanças pendentes

## Considerações Técnicas

### Performance
- **Debouncing**: Controle de frequência de requests
- **Cache local**: Evita fetches desnecessários quando não há mudanças
- **Cleanup**: Limpeza adequada de intervals ao desmontar componente

### Segurança
- **Criptografia**: Todas as notas são criptografadas antes do armazenamento
- **Validação**: Verificações de permissão antes de cada operação
- **Sanitização**: Limpeza de dados antes da exibição

### Escalabilidade
- **Polling eficiente**: Apenas para notas públicas ativas
- **Cleanup automático**: Remove listeners inativos
- **Rate limiting**: Controle de frequência de requests

## Próximos Passos

1. **WebSocket integration**: Substituir polling por conexões em tempo real
2. **Operational transforms**: Algoritmos mais sofisticados para resolução de conflitos
3. **Presence indicators**: Mostrar quais usuários estão editando
4. **Collaborative cursors**: Indicadores de posição de outros editores
5. **Merge automático**: Fusão inteligente de mudanças não-conflitantes

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

## Correções e Melhorias Implementadas

### Problemas Identificados e Solucionados

1. **❌ Bug Crítico: Intervalo de Polling = 0ms**
   - **Problema:** `setInterval(() => {}, 0)` causava chamadas infinitas
   - **Solução:** Corrigido para `setInterval(() => {}, 2000)` (2 segundos)

2. **❌ Chamadas Concorrentes**
   - **Problema:** Múltiplas chamadas simultâneas ao `fetchNoteUpdate`
   - **Solução:** Adicionado flag `isFetching` para prevenir concorrência

3. **❌ Logs de Debug Insuficientes**
   - **Problema:** Dificuldade para diagnosticar problemas
   - **Solução:** Adicionados logs detalhados com prefixo `[CollaborativeSync]`

4. **❌ Dependências Instáveis no useEffect**
   - **Problema:** Hook recriado desnecessariamente causando loops
   - **Solução:** Otimizadas dependências e removida `fetchNoteUpdate` de algumas deps

5. **❌ Controle de Edit Mode**
   - **Problema:** Hook era recriado quando entrava/saía do modo de edição
   - **Solução:** Movido controle para dentro do hook com parâmetro `editMode`

### Otimizações Adicionais

- **Validação Rigorosa:** Múltiplas validações antes de fazer fetch
- **Prevenção de Loops:** Flag de controle para chamadas concorrentes  
- **Logging Detalhado:** Console logs para debugging e monitoramento
- **Gestão de Estado:** Melhor controle de estados de loading e error

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
