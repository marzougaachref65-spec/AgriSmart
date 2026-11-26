import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  PawPrint,
  Sprout,
  Users,
  Wallet,
} from 'lucide-react'
import { TOUS_LES_ROLES, ROLES_ENCADREMENT } from './constants.js'

export const NAVIGATION = [
  {
    section: 'Vue générale',
    items: [
      {
        label: 'Tableau de bord',
        to: '/dashboard',
        icon: LayoutDashboard,
        roles: TOUS_LES_ROLES,
      },
    ],
  },
  {
    section: 'Exploitation',
    items: [
      {
        label: 'Animaux',
        to: '/animaux',
        icon: PawPrint,
        roles: TOUS_LES_ROLES,
      },
      {
        label: 'Cultures & parcelles',
        to: '/cultures',
        icon: Sprout,
        roles: TOUS_LES_ROLES,
      },
      {
        label: 'Gestion des stocks',
        to: '/stocks',
        icon: Boxes,
        roles: TOUS_LES_ROLES,
      },
      {
        label: 'Suivi vétérinaire',
        to: '/veterinaire',
        icon: HeartPulse,
        roles: ROLES_ENCADREMENT,
      },
    ],
  },
  {
    section: 'Gestion',
    items: [
      {
        label: 'Finances',
        to: '/finances',
        icon: Wallet,
        roles: ROLES_ENCADREMENT,
      },
      {
        label: 'Employés',
        to: '/employes',
        icon: Users,
        roles: ROLES_ENCADREMENT,
      },
      {
        label: 'Tâches agricoles',
        to: '/taches',
        icon: ClipboardList,
        roles: TOUS_LES_ROLES,
      },
      {
        label: 'Rapports',
        to: '/rapports',
        icon: BarChart3,
        roles: ROLES_ENCADREMENT,
      },
    ],
  },
  {
    section: 'Communication',
    items: [
      {
        label: 'Notifications',
        to: '/notifications',
        icon: Bell,
        roles: TOUS_LES_ROLES,
      },
    ],
  },
]

const ITEMS_PLATS = NAVIGATION.flatMap((groupe) => groupe.items)

export function getPageTitle(pathname) {
  const item = ITEMS_PLATS.find((entree) => entree.to === pathname)
  return item?.label ?? 'AgriSmart'
}

export function getNavigationPourRole(role) {
  return NAVIGATION.map((groupe) => ({
    section: groupe.section,
    items: groupe.items.filter((item) => item.roles.includes(role)),
  })).filter((groupe) => groupe.items.length > 0)
}
