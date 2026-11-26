import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({
  ouvert,
  titre = 'Confirmer la suppression',
  message,
  nomElement,
  note,
  envoi = false,
  labelConfirmer = 'Confirmer la suppression',
  labelEnvoi = 'Suppression...',
  onAnnuler,
  onConfirmer,
}) {
  return (
    <Modal ouvert={ouvert} titre={titre} onFermer={onAnnuler} largeur="max-w-md">
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>

      {nomElement && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Élément concerné
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {nomElement}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-red-600">
        {note ?? 'Cette action est définitive et supprime la donnée de MongoDB.'}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variante="outline" onClick={onAnnuler} disabled={envoi}>
          Annuler
        </Button>
        <Button variante="danger" onClick={onConfirmer} disabled={envoi}>
          {envoi ? labelEnvoi : labelConfirmer}
        </Button>
      </div>
    </Modal>
  )
}
