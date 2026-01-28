/**
 * @file: EquipmentDetail.tsx
 * @description: Detailed view for a single equipment item.
 * @dependencies: services/api.ts
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { EquipmentDto, EquipmentMovementDto } from '../services/api';
import { DraggableModal } from './DraggableModal';
import { ConfirmDialog } from './ConfirmDialog';

interface EquipmentDetailProps {
  equipmentId: number;
  onClose: () => void;
  onEdit: (equipment: EquipmentDto) => void;
  onDelete?: () => void;
}

export function EquipmentDetail({ equipmentId, onClose, onEdit, onDelete }: EquipmentDetailProps) {
  const [equipment, setEquipment] = useState<EquipmentDto | null>(null);
  const [category, setCategory] = useState<string>('');
  const [movements, setMovements] = useState<EquipmentMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        const equipmentData = await api.equipment.getById(equipmentId);
        setEquipment(equipmentData);

        // Загружаем категорию
        if (equipmentData.categoryId) {
          try {
            const cat = await api.equipmentCategories.getById(equipmentData.categoryId);
            setCategory(cat.name);
          } catch {
            setCategory('Неизвестная категория');
          }
        }

        // Загружаем передвижения
        try {
          const movs = await api.equipmentMovements.findByEquipmentId(equipmentId);
          setMovements(movs.sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()));
        } catch {
          // Игнорируем ошибки загрузки передвижений
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить оборудование');
      } finally {
        setLoading(false);
      }
    };
    loadEquipment();
  }, [equipmentId]);

  const handleDelete = async () => {
    if (!equipment) {
      return;
    }

    setDeleting(true);
    try {
      await api.equipment.delete(equipment.id!);
      // Анимация удаления элемента из списка
      const rowElement = document.querySelector(`[data-equipment-id="${equipment.id}"]`);
      if (rowElement) {
        rowElement.classList.add('table-row-deleting');
      }
      // Анимация удаления модального окна
      const modalElement = document.querySelector('.modal');
      if (modalElement) {
        modalElement.classList.add('modal-deleting');
        setTimeout(() => {
          if (onDelete) {
            onDelete();
          }
          onClose();
        }, 400);
      } else {
        setTimeout(() => {
          if (onDelete) {
            onDelete();
          }
          onClose();
        }, rowElement ? 500 : 0);
      }
    } catch (err: unknown) {
      setDeleting(false);
      alert(err instanceof Error ? err.message : 'Ошибка при удалении');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Доступно',
      in_use: 'В использовании',
      maintenance: 'На обслуживании',
      retired: 'Списано',
    };
    return labels[status] || status;
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      in: 'Поступление',
      out: 'Выдача',
      transfer: 'Перемещение',
      maintenance: 'Обслуживание',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <DraggableModal title="Загрузка..." onClose={onClose}>
        <div>Загрузка...</div>
      </DraggableModal>
    );
  }

  if (error || !equipment) {
    return (
      <DraggableModal title="Ошибка" onClose={onClose}>
        <p>{error || 'Оборудование не найдено'}</p>
      </DraggableModal>
    );
  }

  return (
    <DraggableModal title={equipment.name} onClose={onClose} size="large">
      {equipment.photoUrl && (
        <div className="detail-section" style={{ textAlign: 'center' }}>
          <img
            src={equipment.photoUrl}
            alt={equipment.name}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '400px', 
              objectFit: 'contain', 
              borderRadius: '12px',
              boxShadow: 'var(--shadow-md)'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="detail-section">
        <h3 className="detail-section-title">Основная информация</h3>
        <div className="detail-row">
          <div className="detail-label">Статус</div>
          <div className="detail-value">
            <span className={`tag ${equipment.status}`}>
              {getStatusLabel(equipment.status)}
            </span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-label">Название</div>
          <div className="detail-value">{equipment.name}</div>
        </div>

        {equipment.model && (
          <div className="detail-row">
            <div className="detail-label">Модель</div>
            <div className="detail-value">{equipment.model}</div>
          </div>
        )}

        {equipment.manufacturer && (
          <div className="detail-row">
            <div className="detail-label">Производитель</div>
            <div className="detail-value">{equipment.manufacturer}</div>
          </div>
        )}

        <div className="detail-row">
          <div className="detail-label">Категория</div>
          <div className="detail-value">{category}</div>
        </div>

        {equipment.serialNumber && (
          <div className="detail-row">
            <div className="detail-label">Серийный номер</div>
            <div className="detail-value">
              {equipment.serialNumber}
            </div>
          </div>
        )}

        {equipment.description && (
          <div className="detail-row">
            <div className="detail-label">Описание</div>
            <div className="detail-value">{equipment.description}</div>
          </div>
        )}
      </div>

      {movements.length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">История передвижений</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Откуда</th>
                  <th>Куда</th>
                  <th>Дата</th>
                  <th>Примечания</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => (
                  <tr key={mov.id}>
                    <td>{getMovementTypeLabel(mov.movementType)}</td>
                    <td>{mov.fromLocation || '-'}</td>
                    <td>{mov.toLocation || '-'}</td>
                    <td>{formatDate(mov.movedAt)}</td>
                    <td>{mov.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(equipment.createdAt || equipment.updatedAt) && (
        <div className="detail-section">
          <h3 className="detail-section-title">Метаданные</h3>
          {equipment.createdAt && (
            <div className="detail-row">
              <div className="detail-label">Создано</div>
              <div className="detail-value">{formatDate(equipment.createdAt)}</div>
            </div>
          )}

          {equipment.updatedAt && (
            <div className="detail-row">
              <div className="detail-label">Обновлено</div>
              <div className="detail-value">{formatDate(equipment.updatedAt)}</div>
            </div>
          )}
        </div>
      )}

      <div className="detail-actions">
        <button onClick={() => onEdit(equipment)} className="button-primary">
          Редактировать
        </button>
            <button onClick={handleDeleteClick} disabled={deleting} className="button-danger">
          {deleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удаление оборудования"
        message={`Вы уверены, что хотите удалить оборудование "${equipment?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </DraggableModal>
  );
}
