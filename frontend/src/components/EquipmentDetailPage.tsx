/**
 * @file: EquipmentDetailPage.tsx
 * @description: Полноценная страница просмотра оборудования.
 * @dependencies: services/api, EventPages.css, format
 * @created: 2026-01-27
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { EquipmentDto, EquipmentMovementDto } from '../services/api';
import { formatDateTime } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import './EventPages.css';

export function EquipmentDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Определяем, откуда пришли, чтобы правильно вернуться назад
  const fromPage = (location.state as { from?: string })?.from || 'warehouse';
  const backPath = '/warehouse';
  
  // Извлекаем ID из URL, если useParams не сработал (из-за условного рендеринга в App.tsx)
  const pathMatch = location.pathname.match(/^\/equipment\/(\d+)$/);
  const id = paramId || pathMatch?.[1] || null;
  const [equipment, setEquipment] = useState<EquipmentDto | null>(null);
  const [category, setCategory] = useState<string>('');
  const [movements, setMovements] = useState<EquipmentMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID оборудования не указан');
      setLoading(false);
      return;
    }
    
    const loadEquipment = async () => {
      try {
        setLoading(true);
        setError(null);
        const equipmentId = Number(id);
        if (isNaN(equipmentId)) {
          throw new Error('Неверный ID оборудования');
        }
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
  }, [id]);

  const handleDelete = async () => {
    if (!equipment) return;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await api.equipment.delete(equipment.id!);
      // Анимация удаления
      const pageElement = document.querySelector('.event-page');
      if (pageElement) {
        pageElement.classList.add('item-deleting');
        setTimeout(() => {
          navigate(backPath, { replace: true });
        }, 400);
      } else {
        navigate(backPath, { replace: true });
      }
    } catch (err: unknown) {
      setIsDeleting(false);
      alert(err instanceof Error ? err.message : 'Ошибка при удалении');
    }
  };

  const handleEdit = () => {
    if (equipment?.id) {
      navigate(`/equipment/${equipment.id}/edit`);
    }
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
      <div className="event-page">
        <div className="event-page-loading">Загрузка…</div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="event-page">
        <div className="event-page-header">
          <nav className="event-page-breadcrumb">
            <Link to={backPath}>Склад</Link>
            <span> / </span>
            <span>Ошибка</span>
          </nav>
        </div>
        <div className="event-page-error">{error || 'Оборудование не найдено'}</div>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(backPath)}>
            К списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-page">
      <header className="event-page-header">
        <nav className="event-page-breadcrumb">
          <Link to={backPath}>Склад</Link>
          <span> / </span>
          <span>{equipment.name}</span>
        </nav>
        <h1 className="event-page-title">{equipment.name}</h1>
        <p className="event-page-subtitle">
          <span className={`tag ${equipment.status}`}>
            {getStatusLabel(equipment.status)}
          </span>
        </p>
        <div className="event-page-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(backPath)}>
            ← К списку
          </button>
          <button type="button" className="button-primary" onClick={handleEdit}>
            Редактировать
          </button>
          <button 
            type="button" 
            className="button-danger" 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </header>

      {equipment.photoUrl && (
        <section className="event-section" style={{ textAlign: 'center' }}>
          <div className="event-section-body">
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
        </section>
      )}

      <section className="event-section">
        <h2 className="event-section-title">Основная информация</h2>
        <div className="event-section-body">
          <div className="event-detail-row">
            <div className="event-detail-label">Статус</div>
            <div className="event-detail-value">
              <span className={`tag ${equipment.status}`}>
                {getStatusLabel(equipment.status)}
              </span>
            </div>
          </div>
          <div className="event-detail-row">
            <div className="event-detail-label">Название</div>
            <div className="event-detail-value">{equipment.name}</div>
          </div>
          {equipment.model && (
            <div className="event-detail-row">
              <div className="event-detail-label">Модель</div>
              <div className="event-detail-value">{equipment.model}</div>
            </div>
          )}
          {equipment.manufacturer && (
            <div className="event-detail-row">
              <div className="event-detail-label">Производитель</div>
              <div className="event-detail-value">{equipment.manufacturer}</div>
            </div>
          )}
          <div className="event-detail-row">
            <div className="event-detail-label">Категория</div>
            <div className="event-detail-value">{category}</div>
          </div>
          {equipment.serialNumber && (
            <div className="event-detail-row">
              <div className="event-detail-label">Серийный номер</div>
              <div className="event-detail-value">{equipment.serialNumber}</div>
            </div>
          )}
          {equipment.description && (
            <div className="event-detail-row">
              <div className="event-detail-label">Описание</div>
              <div className="event-detail-value">{equipment.description}</div>
            </div>
          )}
        </div>
      </section>

      {movements.length > 0 && (
        <section className="event-section">
          <h2 className="event-section-title">История передвижений</h2>
          <div className="event-section-body">
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
                      <td>{formatDateTime(mov.movedAt)}</td>
                      <td>{mov.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {(equipment.createdAt || equipment.updatedAt) && (
        <section className="event-section">
          <h2 className="event-section-title">Метаданные</h2>
          <div className="event-section-body">
            {equipment.createdAt && (
              <div className="event-detail-row">
                <div className="event-detail-label">Создано</div>
                <div className="event-detail-value">{formatDateTime(equipment.createdAt)}</div>
              </div>
            )}
            {equipment.updatedAt && (
              <div className="event-detail-row">
                <div className="event-detail-label">Обновлено</div>
                <div className="event-detail-value">{formatDateTime(equipment.updatedAt)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Удаление оборудования"
          message={`Вы уверены, что хотите удалить оборудование "${equipment.name}"? Это действие нельзя отменить.`}
          confirmText="Удалить"
          cancelText="Отмена"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
