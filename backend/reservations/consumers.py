import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ReservationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("reservations_group", self.channel_name)
        await self.accept()
        print("WS conectado:", self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("reservations_group", self.channel_name)
        print("WS desconectado:", self.channel_name)

    async def broadcast_message(self, event):
        # Este método recibe los mensajes del backend y los envía al frontend
        await self.send(text_data=json.dumps(event["message"]))
