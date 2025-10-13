const { getEventById } = require('../../admin-service/models/adminModel');
const ClientModel = require('../models/clientModel');

class clientController{
    //Control behind the GET request for all tickets
    async getAllEvents(req,res){
        try{
            const events = await ClientModel.getAllEvents();
            res.json({
                success: true,
                data: events,
                count: events.length,
            });
        } 
        catch (error){
            console.error('Error fetching events', error);
            res.status(500).json({
                success : false,
                error: "Failed to fetch data from database." 
            });
        }
    }
    // POST request to purchase a ticket
    async purchaseTicket(req,res){
        try{
            const eventID = req.params.id;
            if(!eventID){
                return res.status(400).json({
                    success: false,
                    error: "Event ID is required"
                });

            }
            const updatedEvent = await ClientModel.purchaseTicket(eventID);
            res.json({
                success: true,
                message: "Ticket purchased successfully",
                data: updatedEvent,
            });
        }
        catch(error){
            console.error("Error purchasing ticekt:", error)
            if(error.message === "Event not found"){
                return res.status(404).json({
                    success: false,
                    error: "Event not found"
                });
            }
            if(error.message === "No tickets available"){
                return res.status(400).json({
                    success: false,
                    error: "No tickets availabe for this event",
                });
            }
            res.status(500).json({
                success: false,
                error: "Could not process ticket purchase"
            });
        }
    }
}

module.exports = new clientController();