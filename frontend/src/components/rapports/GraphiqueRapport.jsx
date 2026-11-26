import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardBody, CardHeader } from '../common/Card'
import EtatVide from './EtatVide'
import { couleurGraphique, styleInfobulle } from '../../utils/rapports'

/** Graphique Recharts partagé : mêmes axes, palette et infobulles partout. */
export default function GraphiqueRapport({
  titre,
  sousTitre,
  type = 'bar',
  donnees = [],
  cleLibelle = 'libelle',
  cleValeur = 'valeur',
  formatterValeur,
  nomSerie = 'Valeur',
}) {
  const lignes = Array.isArray(donnees) ? donnees : []

  return (
    <Card>
      <CardHeader titre={titre} sousTitre={sousTitre} />
      <CardBody>
        {lignes.length === 0 ? (
          <EtatVide titre="Aucune donnée à graphiquer" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={lignes}
                    dataKey={cleValeur}
                    nameKey={cleLibelle}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {lignes.map((entree, index) => (
                      <Cell key={entree[cleLibelle] ?? index} fill={couleurGraphique(index)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={styleInfobulle}
                    formatter={formatterValeur}
                  />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={lignes} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey={cleLibelle}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={styleInfobulle} formatter={formatterValeur} />
                  <Legend />
                  <Bar dataKey={cleValeur} name={nomSerie} fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
