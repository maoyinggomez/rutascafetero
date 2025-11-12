import CardRuta from '../CardRuta'
import salentoImg from '@assets/generated_images/Salento_town_route_destination_5fb0d1a7.png'

export default function CardRutaExample() {
  return (
    <div className="p-8 max-w-sm">
      <CardRuta
        id="1"
        nombre="Tour Salento y Pueblo Mágico"
        destino="Salento, Quindío"
        imagen={salentoImg}
        precio={85000}
        duracion="8 horas"
        dificultad="Fácil"
        rating={4.8}
        resenas={124}
      />
    </div>
  )
}
