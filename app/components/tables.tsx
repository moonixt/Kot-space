"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash, Edit2, ChevronsUpDown, X, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de dados para a tabela
export type CellType = "text" | "number" | "select";

// Color option type for select
export type SelectOption = { label: string; color: string };

export type Column = {
  id: string;
  label: string;
  type: CellType;
  options?: SelectOption[]; // Para colunas do tipo select
  width: number;
};

export type Row = {
  id: string;
  [key: string]: any;
};

export type TableData = {
  columns: Column[];
  rows: Row[];
};

// Componente para renderizar uma célula editável
function EditableCell({ 
  value: initialValue, 
  row: rowId, 
  column, 
  updateData 
}: { 
  value: any; 
  row: string; 
  column: Column; 
  updateData: (rowId: string, columnId: string, value: any) => void 
}) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Atualiza o valor local quando o valor da prop muda
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Foca no input quando entra no modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Funções para lidar com a edição
  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      updateData(rowId, column.id, value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      setIsEditing(false);
      if (value !== initialValue) {
        updateData(rowId, column.id, value);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue(initialValue);
    }
  };

  // Renderiza o componente de acordo com o tipo e estado
  if (isEditing) {
    if (column.type === "select" && column.options) {
      return (
        <Select
          value={String(value)}
          onValueChange={(newValue) => {
            setValue(newValue);
            updateData(rowId, column.id, newValue);
            setIsEditing(false);
          }}
          onOpenChange={(open) => {
            if (!open) {
              setIsEditing(false);
            }
          }}
        >
          <SelectTrigger autoFocus className="w-full h-8 px-2">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {column.options.map((option) => (
              <SelectItem key={option.label} value={option.label}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: option.color,
                    marginRight: 6,
                    border: '1px solid #ccc',
                  }} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    } else if (column.type === "number") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value) || 0)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className="w-full h-8 px-2"
        />
      );
    } else {
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className="w-full h-8 px-2"
        />
      );
    }
  }

  // Quando não está em edição, mostra o valor
  let displayValue = value;
  
  // Formatação para número
  if (column.type === "number" && typeof value === "number") {
    displayValue = value.toString();
  }

  return (
    <div 
      className={`h-8 px-2 flex items-center cursor-pointer truncate ${
        column.type === "number" ? "justify-end" : "justify-start"
      }`}
            onClick={() => setIsEditing(true)}
    >
      {displayValue}
    </div>
  );
}

// Componente para o cabeçalho da tabela
function TableHeader({
  columns,
  updateColumn,
  addColumn,
  deleteColumn,
  changeColumnType,
  activeSort,
  sortData,
  resizeColumn
}: {
  columns: Column[];
  updateColumn: (columnId: string, label: string) => void;
  addColumn: (columnId: string, position: "left" | "right") => void;
  deleteColumn: (columnId: string) => void;
  changeColumnType: (columnId: string) => void;
  activeSort: { columnId: string; direction: "asc" | "desc" } | null;
  sortData: (columnId: string) => void;
  resizeColumn: (columnId: string, width: number) => void;
}) {
  return (
    <div className="flex border-b" style={{ background: "var(--table-header-bg)", borderColor: "var(--table-border)" }}>
      {columns.map((column) => (
        <HeaderCell
          key={column.id}
          column={column}
          updateColumn={updateColumn}
          addColumn={addColumn}
          deleteColumn={deleteColumn}
          changeColumnType={changeColumnType}
          isActive={activeSort?.columnId === column.id}
          sortDirection={activeSort?.direction}
          onSort={sortData}
          onResize={resizeColumn}
        />
      ))}
    </div>
  );
}

// Componente para uma célula do cabeçalho
function HeaderCell({
  column,
  updateColumn,
  addColumn,
  deleteColumn,
  changeColumnType,
  isActive,
  sortDirection,
  onSort,
  onResize
}: {
  column: Column;
  updateColumn: (columnId: string, label: string) => void;
  addColumn: (columnId: string, position: "left" | "right") => void;
  deleteColumn: (columnId: string) => void;
  changeColumnType: (columnId: string) => void;
  isActive: boolean;
  sortDirection?: "asc" | "desc";
  onSort: (columnId: string) => void;
  onResize: (columnId: string, width: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(column.label);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(column.width);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const initialPosRef = useRef<number>(0);

  // Foca no input quando entra no modo de edição
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Atualiza o estado local quando a prop muda
  useEffect(() => {
    setValue(column.label);
    setWidth(column.width);
  }, [column]);

  // Funções para edição do nome da coluna
  const handleBlur = () => {
    setEditing(false);
    updateColumn(column.id, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditing(false);
      updateColumn(column.id, value);
    } else if (e.key === "Escape") {
      setEditing(false);
      setValue(column.label);
    }
  };

  // Funções para redimensionamento de coluna
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    initialPosRef.current = e.clientX;
    
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (isResizing && cellRef.current) {
      const diff = e.clientX - initialPosRef.current;
      const newWidth = Math.max(50, width + diff);
      setWidth(newWidth);
      cellRef.current.style.width = `${newWidth}px`;
    }
  }, [isResizing, width]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    onResize(column.id, width);
    
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [column.id, onResize, width, handleResizeMove]);

  // Limpa os event listeners ao desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  return (
    <div 
      ref={cellRef}
      className="flex-none p-2 relative select-none group"
      style={{ width: `${width}px`, background: "var(--table-header-bg)", color: "var(--foreground)", borderRight: "1px solid var(--table-border)" }}
    >
      {/* Resizer */}
      <div
        className={`absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50 ${isResizing ? 'bg-primary/80' : ''}`}
        onMouseDown={handleResizeStart}
      />

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 mb-1">
          {/* Column name - editable */}
          {editing ? (
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="h-7 px-1 text-sm"
            />
          ) : (
            <Button 
              variant="ghost" 
              className="h-7 px-1 hover:bg-accent flex-1 justify-start overflow-hidden"
              onClick={() => onSort(column.id)}
            >
              <span className="truncate font-medium">{column.label}</span>
              
              {isActive && (
                <span className="ml-1">
                  {sortDirection === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                </span>
              )}
              {!isActive && (
                <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/70" />
              )}
            </Button>
          )}

          {/* Column actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0  group-hover:opacity-100">
                <ChevronDown className="h-3.5 w-3.5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Edit2 className="mr-2 h-3.5 w-3.5" /> Renomear coluna
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeColumnType(column.id)}>
                <Edit2 className="mr-2 h-3.5 w-3.5" /> Alterar tipo de dados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => addColumn(column.id, "left")}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar coluna à esquerda
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addColumn(column.id, "right")}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar coluna à direita
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => deleteColumn(column.id)} className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-3.5 w-3.5" /> Deletar coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Column type indicator */}
        <div className="text-xs text-muted-foreground">
          {column.type === "select" ? "Seleção" : column.type === "number" ? "Número" : "Texto"}
        </div>
      </div>
    </div>
  );
}

// Componente principal da tabela
export default function DataTable({ tableName = "default" }: { tableName?: string }) {
  const [data, setData] = useState<TableData>({
    columns: [],
    rows: []
  });
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<{
    columnId: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [columnDialog, setColumnDialog] = useState<{
    open: boolean;
    columnId?: string;
    columnType: CellType;
    options: SelectOption[];
    newOptionText: string;
  }>({
    open: false,
    columnType: "text",
    options: [],
    newOptionText: ""
  });
  
  // Carregar dados do Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar os metadados da tabela (colunas)
      const { data: metadata, error: metadataError } = await supabase
        .from("datatable")
        .select("id, data")
        .eq("table_name", `${tableName}_metadata`)
        .maybeSingle();

      if (metadataError && metadataError.code !== "PGRST116") {
        throw metadataError;
      }

      let columns: Column[] = [];
      
      if (metadata?.data?.columns) {
        columns = metadata.data.columns.map((col: any) => {
          if (col.type === "select" && Array.isArray(col.options) && typeof col.options[0] === "string") {
            // migrate old string options to object
            return {
              ...col,
              options: col.options.map((label: string) => ({ label, color: '#60a5fa' }))
            };
          }
          return col;
        });
      } else {
        // Criar metadados padrão se não existir
        columns = [
          { id: "col1", label: "Título", type: "text", width: 200 },
          { id: "col2", label: "Descrição", type: "text", width: 300 },
          { id: "col3", label: "Status", type: "select", options: [
            { label: "Pendente", color: '#f59e42' },
            { label: "Em progresso", color: '#60a5fa' },
            { label: "Concluído", color: '#22c55e' }
          ], width: 150 }
        ];
        
        // Salvar os metadados padrão
        const { error: saveError } = await supabase
          .from("datatable")
          .insert({
            table_name: `${tableName}_metadata`,
            data: { columns }
          });
          
        if (saveError) {
          throw saveError;
        }
      }

      // Buscar os dados das linhas
      const { data: rows, error: rowsError } = await supabase
        .from("datatable")
        .select("id, data")
        .eq("table_name", tableName);

      if (rowsError) {
        throw rowsError;
      }

      // Transformar os dados para serem mais fáceis de usar
      const formattedRows = rows?.map(row => ({
        id: row.id,
        ...row.data
      })) || [];

      setData({
        columns,
        rows: formattedRows
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Não foi possível carregar os dados da tabela");
    } finally {
      setLoading(false);
    }
  };

  // Salvar os metadados (colunas) no Supabase
  const saveMetadata = async (columns: Column[]) => {
    try {
      // Verificar se o metadata já existe
      const { data: existing, error: checkError } = await supabase
        .from("datatable")
        .select("id")
        .eq("table_name", `${tableName}_metadata`)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Atualizar metadados existentes
        const { error } = await supabase
          .from("datatable")
          .update({ data: { columns } })
          .eq("table_name", `${tableName}_metadata`);

        if (error) throw error;
      } else {
        // Inserir novos metadados
        const { error } = await supabase
          .from("datatable")
          .insert({
            table_name: `${tableName}_metadata`,
            data: { columns }
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao salvar metadados:", error);
      toast.error("Não foi possível salvar as configurações da tabela");
      throw error;
    }
  };

  // Atualizar dados de uma célula
  const updateData = async (rowId: string, columnId: string, value: any) => {
    try {
      // Encontrar a linha a ser atualizada
      const row = data.rows.find(r => r.id === rowId);
      if (!row) return;

      // Criar uma cópia dos dados atualizados
      const updatedData = {
        ...Object.fromEntries(
          data.columns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        ),
        [columnId]: value
      };

      // Atualizar no Supabase
      const { error } = await supabase
        .from("datatable")
        .update({ data: updatedData })
        .eq("id", rowId);

      if (error) throw error;

      // Atualizar os dados locais
      setData(prev => ({
        ...prev,
        rows: prev.rows.map(r => 
          r.id === rowId ? { ...r, [columnId]: value } : r
        )
      }));
      
      // Feedback sutil para o usuário
      toast.success("Alteração salva", {
        duration: 1500,
        position: "bottom-right",
        className: "bg-primary text-primary-foreground"
      });
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast.error("Não foi possível atualizar a célula");
    }
  };

  // Adicionar uma nova linha
  const addRow = async () => {
    try {
      // Criar um objeto com valores padrão para cada coluna
      const newRowData = Object.fromEntries(
        data.columns.map(column => [
          column.id, 
          column.type === "number" ? 0 : 
          column.type === "select" && column.options?.length ? column.options[0].label : ""
        ])
      );

      // Inserir no Supabase
      const { data: insertedRow, error } = await supabase
        .from("datatable")
        .insert({
          table_name: tableName,
          data: newRowData
        })
        .select("id")
        .single();

      if (error) throw error;

      // Adicionar a nova linha aos dados locais
      setData(prev => ({
        ...prev,
        rows: [
          {
            id: insertedRow.id,
            ...newRowData
          },
          ...prev.rows
        ]
      }));

      toast.success("Nova linha adicionada");
    } catch (error) {
      console.error("Erro ao adicionar linha:", error);
      toast.error("Não foi possível adicionar uma nova linha");
    }
  };

  // Atualizar uma coluna
  const updateColumn = async (columnId: string, label: string) => {
    try {
      const updatedColumns = data.columns.map(col => 
        col.id === columnId ? { ...col, label } : col
      );
      
      // Atualizar os metadados no Supabase
      await saveMetadata(updatedColumns);
      
      // Atualizar dados locais
      setData(prev => ({
        ...prev,
        columns: updatedColumns
      }));
    } catch (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast.error("Não foi possível atualizar a coluna");
    }
  };

  // Redimensionar uma coluna
  const resizeColumn = async (columnId: string, width: number) => {
    try {
      const updatedColumns = data.columns.map(col => 
        col.id === columnId ? { ...col, width } : col
      );
      
      // Atualizar os metadados no Supabase
      await saveMetadata(updatedColumns);
      
      // Atualizar dados locais
      setData(prev => ({
        ...prev,
        columns: updatedColumns
      }));
    } catch (error) {
      console.error("Erro ao redimensionar coluna:", error);
      // Não mostramos toast de erro aqui para não sobrecarregar o usuário
    }
  };

  // Adicionar uma nova coluna
  const addColumn = async (adjacentColumnId: string, position: "left" | "right") => {
    try {
      // Encontrar o índice da coluna adjacente
      const columnIndex = data.columns.findIndex(col => col.id === adjacentColumnId);
      if (columnIndex === -1) return;
      
      // Gerar um ID único para a nova coluna
      const newColumnId = `col${Date.now()}`;
      
      // Criar a nova coluna
      const newColumn: Column = {
        id: newColumnId,
        label: "Nova Coluna",
        type: "text",
        width: 150
      };
      
      // Inserir a nova coluna na posição correta
      const newColumns = [...data.columns];
      newColumns.splice(
        position === "left" ? columnIndex : columnIndex + 1,
        0,
        newColumn
      );
      
      // Adicionar o campo à todas as linhas existentes com valor vazio
      const updatedRows = data.rows.map(row => ({
        ...row,
        [newColumnId]: ""
      }));
      
      // Atualizar os metadados no Supabase
      await saveMetadata(newColumns);

      // Atualizar todas as linhas no Supabase para incluir o novo campo
      for (const row of updatedRows) {
        const rowData = Object.fromEntries(
          newColumns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        );
        
        await supabase
          .from("datatable")
          .update({ data: rowData })
          .eq("id", row.id);
      }
      
      // Atualizar dados locais
      setData(prev => ({
        columns: newColumns,
        rows: updatedRows
      }));
      
      toast.success("Nova coluna adicionada");
    } catch (error) {
      console.error("Erro ao adicionar coluna:", error);
      toast.error("Não foi possível adicionar a coluna");
    }
  };

  // Adicionar coluna ao final
  const addColumnToEnd = async () => {
    try {
      // Gerar um ID único para a nova coluna
      const newColumnId = `col${Date.now()}`;
      
      // Criar a nova coluna
      const newColumn: Column = {
        id: newColumnId,
        label: "Nova Coluna",
        type: "text",
        width: 150
      };
      
      const newColumns = [...data.columns, newColumn];
      
      // Adicionar o campo à todas as linhas existentes com valor vazio
      const updatedRows = data.rows.map(row => ({
        ...row,
        [newColumnId]: ""
      }));
      
      // Atualizar os metadados no Supabase
      await saveMetadata(newColumns);
      
      // Atualizar todas as linhas no Supabase para incluir o novo campo
      for (const row of updatedRows) {
        const rowData = Object.fromEntries(
          newColumns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        );
        
        await supabase
          .from("datatable")
          .update({ data: rowData })
          .eq("id", row.id);
      }
      
      // Atualizar dados locais
      setData(prev => ({
        columns: newColumns,
        rows: updatedRows
      }));
      
      toast.success("Nova coluna adicionada");
    } catch (error) {
      console.error("Erro ao adicionar coluna:", error);
      toast.error("Não foi possível adicionar a coluna");
    }
  };

  // Deletar uma coluna
  const deleteColumn = async (columnId: string) => {
    try {
      // Verificar se restará pelo menos uma coluna
      if (data.columns.length <= 1) {
        toast.error("Não é possível remover a última coluna");
        return;
      }
      
      // Filtrar a coluna a ser removida
      const newColumns = data.columns.filter(col => col.id !== columnId);
      
      // Remover o campo de todas as linhas
      const updatedRows = data.rows.map(row => {
        const newRow = { ...row };
        delete newRow[columnId];
        return newRow;
      });
      
      // Atualizar os metadados no Supabase
      await saveMetadata(newColumns);
      
      // Atualizar todas as linhas no Supabase para remover o campo
      for (const row of updatedRows) {
        const rowData = Object.fromEntries(
          newColumns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        );
        
        await supabase
          .from("datatable")
          .update({ data: rowData })
          .eq("id", row.id);
      }
      
      // Atualizar dados locais
      setData(prev => ({
        columns: newColumns,
        rows: updatedRows
      }));
      
      toast.success("Coluna removida");
    } catch (error) {
      console.error("Erro ao remover coluna:", error);
      toast.error("Não foi possível remover a coluna");
    }
  };

  // Deletar uma linha
  const deleteRow = async (rowId: string) => {
    try {
      // Deletar no Supabase
      const { error } = await supabase
        .from("datatable")
        .delete()
        .eq("id", rowId);

      if (error) throw error;

      // Atualizar dados locais
      setData(prev => ({
        ...prev,
        rows: prev.rows.filter(r => r.id !== rowId)
      }));
      
      toast.success("Linha removida");
    } catch (error) {
      console.error("Erro ao remover linha:", error);
      toast.error("Não foi possível remover a linha");
    }
  };

  // Alterar o tipo de coluna
  const changeColumnType = (columnId: string) => {
    try {
      const column = data.columns.find(col => col.id === columnId);
      if (!column) return;

      setColumnDialog({
        open: true,
        columnId,
        columnType: column.type,
        options: column.options || [],
        newOptionText: ""
      });
    } catch (error) {
      console.error("Erro ao alterar tipo de coluna:", error);
      toast.error("Não foi possível alterar o tipo da coluna");
    }
  };

  // Salvar as alterações de tipo de coluna
  const saveColumnTypeChanges = async () => {
    try {
      if (!columnDialog.columnId) return;

      const updatedColumns = data.columns.map(col => 
        col.id === columnDialog.columnId 
          ? { 
              ...col, 
              type: columnDialog.columnType,
              options: columnDialog.columnType === "select" ? columnDialog.options : undefined
            } 
          : col
      );
      
      // Atualizar os metadados no Supabase
      await saveMetadata(updatedColumns);
      
      // Atualizar dados locais
      setData(prev => ({
        ...prev,
        columns: updatedColumns
      }));
      
      setColumnDialog(prev => ({ ...prev, open: false }));
      toast.success("Tipo de coluna alterado");
    } catch (error) {
      console.error("Erro ao salvar tipo de coluna:", error);
      toast.error("Não foi possível salvar o tipo da coluna");
    }
  };

  // Ordenar dados
  const sortData = (columnId: string) => {
    let direction: "asc" | "desc" = "asc";
    
    if (activeSort?.columnId === columnId) {
      if (activeSort.direction === "asc") {
        direction = "desc";
      } else {
        // Se já estiver em desc, remover a ordenação
        setActiveSort(null);
        setData(prev => ({
          ...prev,
          rows: [...prev.rows].sort((a, b) => {
            // Ordenação padrão por ID para reverter à ordem original
            return a.id.localeCompare(b.id);
          })
        }));
        return;
      }
    }
    
    setActiveSort({ columnId, direction });
    
    setData(prev => {
      const column = prev.columns.find(col => col.id === columnId);
      if (!column) return prev;
      
      const sortedRows = [...prev.rows].sort((a, b) => {
        const aVal = a[columnId];
        const bVal = b[columnId];
        
        if (column.type === "number") {
          return direction === "asc" 
            ? Number(aVal || 0) - Number(bVal || 0)
            : Number(bVal || 0) - Number(aVal || 0);
        }
        
        // Para texto e select
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return direction === "asc" ? -1 : 1;
        if (bVal === undefined || bVal === null) return direction === "asc" ? 1 : -1;
        
        return direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
      
      return { ...prev, rows: sortedRows };
    });
  };

  // Carregar dados quando o componente for montado
  useEffect(() => {
    fetchData();
  }, [tableName]);

  // Manipular opções para campos select
  const addOption = () => {
    if (!columnDialog.newOptionText.trim()) return;
    // Default color for new option
    setColumnDialog(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { label: prev.newOptionText.trim(), color: '#60a5fa' } // blue as default
      ],
      newOptionText: ""
    }));
  };
  
  const removeOption = (option: SelectOption) => {
    setColumnDialog(prev => ({
      ...prev,
      options: prev.options.filter(o => o.label !== option.label)
    }));
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{tableName}</h2>
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto" style={{ borderColor: "var(--table-border)", background: "var(--background)" }}>
          {/* Cabeçalho da tabela */}
          <TableHeader 
            columns={data.columns}
            updateColumn={updateColumn}
            addColumn={addColumn}
            deleteColumn={deleteColumn}
            changeColumnType={changeColumnType}
            activeSort={activeSort}
            sortData={sortData}
            resizeColumn={resizeColumn}
          />
          {/* Add row/column buttons inside table, like the reference */}
          <div className="flex w-full border-b border-[var(--table-border)] bg-[var(--container)] px-2 py-2 gap-2">
            <Button variant="outline" size="sm" onClick={addRow} style={{ background: "var(--foreground)", color: "var(--background)", borderColor: "var(--table-border)" }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Linha
            </Button>
            <Button variant="outline" size="sm" onClick={addColumnToEnd} style={{ background: "var(--foreground)", color: "var(--background)", borderColor: "var(--table-border)" }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Coluna
            </Button>
          </div>
          {/* Corpo da tabela */}
          <div className="divide-y">
            {data.rows.length > 0 ? (
              data.rows.map((row) => (
                <div key={row.id} className="flex hover:bg-muted/50">
                  {data.columns.map((column) => (
                    <div 
                      key={`${row.id}-${column.id}`}
                      className="flex-none p-2 relative"
                      style={{ width: `${column.width}px` }}
                    >
                      <EditableCell
                        value={row[column.id] !== undefined ? row[column.id] : ""}
                        row={row.id}
                        column={column}
                        updateData={updateData}
                      />
                    </div>
                  ))}
                  <div className="p-2 flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0  hover:opacity-100 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteRow(row.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Deletar linha</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deletar linha</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Nenhum dado encontrado</p>
                <Button variant="outline" size="sm" onClick={addRow} style={{ background: "var(--foreground)", color: "var(--background)", borderColor: "var(--table-border)" }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Linha
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diálogo para alterar tipo de coluna */}
      <Dialog open={columnDialog.open} onOpenChange={(open) => setColumnDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Tipo de Coluna</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="column-type" className="text-sm font-medium">
                Tipo de Coluna
              </label>
              <Select
                value={columnDialog.columnType}
                onValueChange={(value) => setColumnDialog(prev => ({ ...prev, columnType: value as CellType }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="select">Seleção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {columnDialog.columnType === "select" && (
              <div className="grid gap-2">
                <label htmlFor="select-options" className="text-sm font-medium">
                  Opções de Seleção
                </label>
                <div className="flex gap-2">
                  <Input
                    id="select-options"
                    value={columnDialog.newOptionText}
                    onChange={(e) => setColumnDialog(prev => ({ ...prev, newOptionText: e.target.value }))}
                    placeholder="Adicionar opção..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button type="button" onClick={addOption}>
                    Adicionar
                  </Button>
                </div>
                <div className="mt-2 max-h-[200px] overflow-auto">
                  <ul className="space-y-1">
                    {columnDialog.options.map((option, idx) => (
                      <li key={option.label} className="flex items-center justify-between bg-muted p-2 rounded-md gap-2">
                        <span className="flex items-center gap-2">
                          <span style={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: option.color,
                            border: '1px solid #ccc',
                          }} />
                          {option.label}
                        </span>
                        <input
                          type="color"
                          value={option.color}
                          onChange={e => {
                            const newColor = e.target.value;
                            setColumnDialog(prev => ({
                              ...prev,
                              options: prev.options.map((o, i) => i === idx ? { ...o, color: newColor } : o)
                            }));
                          }}
                          style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
                          title="Escolher cor"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(option)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remover opção</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColumnDialog(prev => ({ ...prev, open: false }))}>
              Cancelar
            </Button>
            <Button onClick={saveColumnTypeChanges}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
